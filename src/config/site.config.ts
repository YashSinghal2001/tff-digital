export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Website",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  defaultLocale: "en",
} as const;
