import { ROUTES } from "@/constants/routes";
import type { ServiceOffering } from "@/types/domain/service-offering";

/**
 * Narrow presentation shape for the service cards on the homepage and the
 * /services listing. Both grids are client components, so only what they
 * render crosses the RSC boundary — never `seo` (Yoast JSON-LD carries
 * cms.tffdigital.com URLs, SEO-2), `content`, or media objects.
 */
export interface ServiceCardItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  features: string[];
  /** Detail page for the service, derived from its WordPress slug. */
  href: string;
}

export interface ServiceCardOptions {
  /**
   * Cap on features per card, applied here on the server so the client only
   * receives what it renders: the compact homepage card shows three, while
   * /services renders the full list.
   */
  featureLimit?: number;
}

export function toServiceCardItems(
  services: readonly ServiceOffering[],
  { featureLimit }: ServiceCardOptions = {},
): ServiceCardItem[] {
  return services.map(({ id, slug, title, summary, features }) => ({
    id,
    slug,
    title,
    summary,
    features:
      featureLimit === undefined ? features : features.slice(0, featureLimit),
    href: ROUTES.service(slug),
  }));
}
