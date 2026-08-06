import type { Media } from "@/types/domain/media";
import type { Seo } from "@/types/domain/seo";
import type { ServiceOffering } from "@/types/domain/service-offering";

export interface CaseStudyMetric {
  label: string;
  value: string;
}

export interface CaseStudy {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  client: string | null;
  industry: string | null;
  featuredImage: Media | null;
  metrics: CaseStudyMetric[];
  relatedServices: ServiceOffering[];
  seo: Seo | null;
}
