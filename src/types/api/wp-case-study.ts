import type { WPConnection } from "@/types/api/wp-connection";
import type { WPMediaItem } from "@/types/api/wp-media";
import type { WPSeo } from "@/types/api/wp-seo";
import type { WPServiceOffering } from "@/types/api/wp-service-offering";

export interface WPCaseStudyFields {
  clientName: string | null;
  industry: string | null;
  projectUrl: string | null;
  shortSummary: string | null;
  challenge: string | null;
  solution: string | null;
  // ACF Repeater is unavailable on this WordPress installation, so "Results"
  // is four fixed label/value field pairs instead of a true repeater.
  result1Label: string | null;
  result1Value: string | null;
  result2Label: string | null;
  result2Value: string | null;
  result3Label: string | null;
  result3Value: string | null;
  result4Label: string | null;
  result4Value: string | null;
  featuredOnHomepage: boolean | null;
  relatedServices: { nodes: WPServiceOffering[] } | null;
}

export interface WPCaseStudy {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  date: string;
  modified: string;
  featuredImage: { node: WPMediaItem } | null;
  caseStudyFields: WPCaseStudyFields | null;
  seo: WPSeo | null;
  // Only requested by the preview query (GET_CASE_STUDY_PREVIEW) — undefined
  // on every public query's response.
  databaseId?: number;
  status?: string;
}

export interface WPCaseStudiesQueryResult {
  caseStudies: WPConnection<WPCaseStudy>;
}

export interface WPCaseStudyQueryResult {
  caseStudy: WPCaseStudy | null;
}
