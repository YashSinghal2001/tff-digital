export const siteConfig = {
  // Env vars still win everywhere (Vercel dashboard, .env.local); these
  // fallbacks exist so a build with the vars missing ships real production
  // values instead of "Website" titles and localhost canonicals/sitemap URLs.
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "TFF Digital",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://tffdigital.com",
  defaultLocale: "en",
} as const;
