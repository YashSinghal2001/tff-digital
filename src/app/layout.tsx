import type { Metadata } from "next";
import { Poppins, Open_Sans } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/config/site.config";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { JsonLd } from "@/components/common/JsonLd";
import { HashScrollHandler } from "@/components/common/HashScrollHandler";
import { MotionProvider } from "@/components/common/MotionProvider";
import { CookieConsentBanner } from "@/components/common/CookieConsentBanner";
import { buildOrganizationJsonLd, buildWebsiteJsonLd } from "@/lib/seo/json-ld";
import { SITE_OPEN_GRAPH_DEFAULTS } from "@/lib/seo/metadata";
import { GTM_CONTAINER_ID } from "@/constants/analytics";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "optional",
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "optional",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: "Digital growth agency — strategy, branding, and performance marketing.",
  // Pages that don't declare their own openGraph/twitter inherit this; Next
  // falls the title/description back to the page's own resolved metadata.
  // The image is the sitewide default share card — WP-sourced pages with a
  // Yoast OG image override the whole openGraph object via buildMetadata.
  openGraph: SITE_OPEN_GRAPH_DEFAULTS,
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/*
          Google Consent Mode v2 default state. Must render — and therefore
          execute — before #gtm-bootstrap below, so GTM/GA4 see it as soon as
          they parse the dataLayer, per Google's own consent guide
          (https://developers.google.com/tag-platform/security/guides/consent).
          Denies analytics/ad storage by default; the actual grant/deny comes
          from the visitor's cookie-notice decision via
          src/lib/consent/cookie-consent.ts (see CookieConsentBanner.tsx),
          which pushes a 'consent update' once known (immediately, on mount,
          for a returning visitor with a stored decision). This site runs no
          ad tags, so the ad_* signals are only ever set here, to 'denied'.
        */}
        <script
          id="consent-default"
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){window.dataLayer.push(arguments);}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied'});`,
          }}
        />
        {/*
          Client-provided Google Tag Manager container (GTM-KTSN4NHB).
          A raw <head> element here is App Router's documented escape hatch
          for content the Metadata API can't express — see
          https://nextjs.org/docs/app/api-reference/file-conventions/layout#the-head-element.
          This is a plain <script>, deliberately not next/script: that
          component's earliest-loading option only guarantees the script
          *executes* before hydration — in App Router it does this by
          injecting via Next's own side-channel immediately after <body>
          opens, ignoring wherever its own component sits in the tree. A
          literal <script> placed here renders exactly where authored (in
          <head>) and, being synchronous and unmodified by async/defer,
          still runs before the rest of the document parses — matching
          Google's own install instructions and this client's requirement.
          @next/third-parties/google's GoogleTagManager component (which
          next/next/next-script-for-ga suggests below) is not installed in
          this project and would be a new dependency — out of scope for a
          placement-only fix, and it wouldn't change where the script lands
          relative to this hand-authored <head> anyway.
        */}
        {/* eslint-disable-next-line @next/next/next-script-for-ga */}
        <script
          id="gtm-bootstrap"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+i:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_CONTAINER_ID}');`,
          }}
        />
      </head>
      <body className={`${poppins.variable} ${openSans.variable} antialiased`}>
        {/*
          GTM noscript fallback, placed as the very first element inside
          <body>, matching Google's own installation instructions.
        */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_CONTAINER_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-background focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          Skip to main content
        </a>
        <JsonLd data={[buildOrganizationJsonLd(), buildWebsiteJsonLd()]} />
        <HashScrollHandler />
        <MotionProvider>
          <Navbar />
          <main id="main-content" tabIndex={-1} className="pt-24 outline-none">
            {children}
          </main>
          <Footer />
          <CookieConsentBanner />
        </MotionProvider>
      </body>
    </html>
  );
}
