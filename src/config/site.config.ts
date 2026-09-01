export const siteConfig = {
  // Env vars still win everywhere (Vercel dashboard, .env.local); these
  // fallbacks exist so a build with the vars missing ships real production
  // values instead of "Website" titles and localhost canonicals/sitemap URLs.
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "TFF Digital",
  // www is the client-approved primary domain (the apex 301s to it), so the
  // fallback must match it — an apex fallback would re-point every canonical,
  // sitemap, and JSON-LD URL at a redirecting host if the env var were lost.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.tffdigital.com",
  defaultLocale: "en",
} as const;
