import path from "path";
import type { NextConfig } from "next";

const wordpressMediaHostname = process.env.WORDPRESS_MEDIA_HOSTNAME;

// Next.js injects its own inline hydration/RSC-streaming <script> tags with
// no nonce by default; locking script-src down to 'self' without
// 'unsafe-inline' would break hydration on every page. A nonce-based CSP
// would remove this need but requires middleware.ts plus wiring next/headers
// through every layout — a bigger architecture change than this pass calls
// for. next/image's `fill` mode also sets inline style="..." on the
// underlying <img>, so style-src needs the same allowance.
const scriptSrc = ["'self'", "'unsafe-inline'"];
if (process.env.NODE_ENV !== "production") {
  // Turbopack/webpack HMR in `next dev` requires eval; production builds do not.
  scriptSrc.push("'unsafe-eval'");
}

const cspDirectives = [
  `default-src 'self'`,
  `script-src ${scriptSrc.join(" ")}`,
  `style-src 'self' 'unsafe-inline'`,
  // next/font self-hosts Google Fonts at build time (no fonts.gstatic.com request at runtime).
  `font-src 'self'`,
  // WordPress media host + the placehold.co mock fallback (see images.remotePatterns below), plus data: for any inline/blur placeholders.
  // s.wordpress.com serves the Selected Work website-preview screenshots (src/lib/content/website-preview.ts).
  `img-src 'self' data:${wordpressMediaHostname ? ` https://${wordpressMediaHostname}` : ""} https://placehold.co https://s.wordpress.com`,
  // WP oEmbed YouTube embeds rendered inside ArticleContent (see src/components/blog/ArticleContent.tsx),
  // plus the Google Maps embed on the contact page (src/sections/contact/ContactFormSection.tsx).
  `frame-src 'self' https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com https://www.google.com`,
  `frame-ancestors 'self'`,
  `connect-src 'self'`,
  `object-src 'none'`,
  `base-uri 'self'`,
].join("; ");

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [
      ...(wordpressMediaHostname
        ? [{ protocol: "https" as const, hostname: wordpressMediaHostname }]
        : []),
      // Mock media host used by src/lib/mock while WORDPRESS_USE_MOCK_DATA=true.
      { protocol: "https" as const, hostname: "placehold.co" },
      // WordPress's own get_avatar_url() falls back to Gravatar (secure.gravatar.com)
      // for any user without a custom-uploaded avatar — confirmed live on the
      // "admin" author. Without this, next/image's optimizer 400s on every such
      // avatar (see src/components/blog/AuthorCard.tsx).
      { protocol: "https" as const, hostname: "secure.gravatar.com" },
      // WordPress.com's mshots screenshot service — powers the Selected Work
      // website-preview cards (src/lib/content/website-preview.ts) from each
      // Case Study's Project URL. One fixed, trusted host; the target URL it
      // screenshots is validated (http/https, no local/private addresses)
      // before this app ever builds a URL pointing at it.
      { protocol: "https" as const, hostname: "s.wordpress.com" },
    ],
    // The WordPress media host sends no Cache-Control header, so optimized
    // images fall back to the 60s default TTL — and the host is slow enough
    // (5-7s per image) that every re-fetch hits the optimizer's 7s upstream
    // timeout and 504s. Keep successfully optimized variants for 31 days.
    minimumCacheTTL: 2678400,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          { key: "Content-Security-Policy", value: cspDirectives },
        ],
      },
    ];
  },
};

export default nextConfig;
