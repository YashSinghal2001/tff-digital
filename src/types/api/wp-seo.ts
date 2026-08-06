import type { WPMediaItem } from "@/types/api/wp-media";

export interface WPSeoSchema {
  raw: string | null;
}

/**
 * Shape produced by the WPGraphQL SEO plugin (Yoast bridge).
 */
export interface WPSeo {
  title: string | null;
  metaDesc: string | null;
  canonical: string | null;
  opengraphTitle: string | null;
  opengraphDescription: string | null;
  opengraphImage: WPMediaItem | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImage: WPMediaItem | null;
  metaRobotsNoindex: string | null;
  metaRobotsNofollow: string | null;
  schema: WPSeoSchema | null;
}
