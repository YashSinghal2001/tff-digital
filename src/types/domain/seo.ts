import type { Media } from "@/types/domain/media";

export interface OpenGraphData {
  title: string;
  description: string;
  image: Media | null;
  type: "website" | "article";
}

export interface TwitterCardData {
  card: "summary" | "summary_large_image";
  title: string;
  description: string;
  image: Media | null;
}

export interface RobotsDirective {
  index: boolean;
  follow: boolean;
}

export interface Seo {
  title: string;
  description: string;
  canonicalUrl: string | null;
  openGraph: OpenGraphData;
  twitter: TwitterCardData;
  robots: RobotsDirective;
  jsonLd: Record<string, unknown> | null;
}
