import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site.config";

export function getRobotsConfig(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
