import type { WPConnection } from "@/types/api/wp-connection";
import type { WPMediaItem } from "@/types/api/wp-media";
import type { WPSeo } from "@/types/api/wp-seo";
import type { WPServiceOffering } from "@/types/api/wp-service-offering";

export interface WPCaseStudyMetric {
  label: string;
  value: string;
}

export interface WPCaseStudy {
  id: string;
  slug: string;
  title: string;
  content: string;
  summary: string | null;
  client: string | null;
  industry: string | null;
  featuredImage: { node: WPMediaItem } | null;
  metrics: WPCaseStudyMetric[] | null;
  relatedServices: WPServiceOffering[] | null;
  seo: WPSeo | null;
}

export interface WPCaseStudiesQueryResult {
  caseStudies: WPConnection<WPCaseStudy>;
}

export interface WPCaseStudyQueryResult {
  caseStudy: WPCaseStudy | null;
}
