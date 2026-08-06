import { siteConfig } from "@/config/site.config";

export const seoConfig = {
  defaultTitle: siteConfig.name,
  titleTemplate: `%s | ${siteConfig.name}`,
  defaultDescription: "",
  twitterHandle: "",
  defaultOgImage: null as string | null,
} as const;
