import type { WPCaseStudy } from "@/types/api/wp-case-study";
import type { CaseStudy } from "@/types/domain/case-study";
import { adaptMedia } from "@/adapters/media.adapter";
import { adaptSeo } from "@/adapters/seo.adapter";
import { adaptServiceOffering } from "@/adapters/service-offering.adapter";

export function adaptCaseStudy(wpCaseStudy: WPCaseStudy): CaseStudy {
  return {
    id: wpCaseStudy.id,
    slug: wpCaseStudy.slug,
    title: wpCaseStudy.title,
    summary: wpCaseStudy.summary ?? "",
    content: wpCaseStudy.content,
    client: wpCaseStudy.client,
    industry: wpCaseStudy.industry,
    featuredImage: wpCaseStudy.featuredImage
      ? adaptMedia(wpCaseStudy.featuredImage.node)
      : null,
    metrics: wpCaseStudy.metrics ?? [],
    relatedServices:
      wpCaseStudy.relatedServices?.map(adaptServiceOffering) ?? [],
    seo: adaptSeo(wpCaseStudy.seo, {
      title: wpCaseStudy.title,
      description: wpCaseStudy.summary ?? "",
    }),
  };
}
