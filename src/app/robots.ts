import type { MetadataRoute } from "next";
import { getRobotsConfig } from "@/lib/seo/robots";

export default function robots(): MetadataRoute.Robots {
  return getRobotsConfig();
}
