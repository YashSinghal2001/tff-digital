import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { draftMode } from "next/headers";
import Image from "next/image";
import {
  getServiceOfferingBySlug,
  getServiceOfferingPreviewBySlug,
  getServiceOfferings,
} from "@/services/service-offering.service";
import type { ServiceOffering } from "@/types/domain/service-offering";
import { Container } from "@/components/ui/Container";
import { IconCircle } from "@/components/ui/IconCircle";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { ArticleContent } from "@/components/blog/ArticleContent";
import { FAQ } from "@/sections/shared/FAQ";
import { CTABookForm } from "@/sections/shared/CTABookForm";
import { JsonLd } from "@/components/common/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { htmlToPlainText } from "@/lib/content/post-content";
import { getServiceIcon } from "@/lib/content/service-icons";
import { ROUTES } from "@/constants/routes";

interface ServiceDetailPageProps {
  params: Promise<{ slug: string }>;
}

// Prerender every known WordPress service at build time (PERF-1) — the
// static copies revalidate via the fetch-level 30s ISR window, matching the
// blog and case-study detail routes; previously every visit was a fully
// dynamic live WordPress round-trip. Soft getServiceOfferings: a build-time
// outage yields [] and the build still succeeds; slugs then render on demand
// exactly as before (dynamicParams stays on for services published between
// deploys). The truthy-slug filter keeps a malformed CMS entry from emitting
// an empty path segment.
export async function generateStaticParams() {
  const services = await getServiceOfferings({ first: 100 });
  return services.items
    .filter((service) => service.slug)
    .map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: ServiceDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { isEnabled: isPreview } = await draftMode();
  let service: ServiceOffering | null;
  try {
    service = isPreview
      ? await getServiceOfferingPreviewBySlug(slug)
      : await getServiceOfferingBySlug(slug);
  } catch {
    // Metadata must never be the reason a route dies: on a CMS failure fall
    // back to the site defaults and let the page component decide the outcome.
    return {};
  }
  if (!service) return {};

  // Content-derived fallback so a service without Yoast data still gets its
  // own title/description instead of the site defaults.
  const metadata = buildMetadata(service.seo, getCanonicalUrl(ROUTES.service(slug)), {
    title: service.title,
    description: service.summary ? htmlToPlainText(service.summary) : undefined,
  });

  // Draft/unpublished content must never be indexed, regardless of what the
  // service's own SEO fields say.
  return isPreview ? { ...metadata, robots: { index: false, follow: false } } : metadata;
}

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const { slug } = await params;
  const { isEnabled: isPreview } = await draftMode();
  // getServiceOfferingBySlug throws on a CMS failure (surfaces as the error
  // boundary, a 5xx) rather than a wrong 404 — matches the resilience
  // pattern used everywhere else in this app. Preview mode can only ever be
  // reached via /api/preview/service's signed, WordPress-authenticated
  // flow — a bare ?preview=true with no draft-mode cookie has no effect.
  const service = isPreview
    ? await getServiceOfferingPreviewBySlug(slug)
    : await getServiceOfferingBySlug(slug);
  if (!service) notFound();

  const canonicalUrl = getCanonicalUrl(ROUTES.service(slug));
  const Icon = getServiceIcon(service.slug);

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: getCanonicalUrl(ROUTES.home) },
          { name: "Services", url: getCanonicalUrl(ROUTES.services) },
          { name: service.title, url: canonicalUrl },
        ])}
      />

      <article className="py-10 lg:py-16">
        <Container size="full" className="max-w-[1280px]">
          <Breadcrumbs
            items={[{ label: "Services", href: ROUTES.services }, { label: service.title }]}
            className="mb-6"
          />

          <header className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
            <IconCircle icon={Icon} size="lg" />

            <h1 className="font-heading text-[32px] font-bold leading-tight text-white sm:text-[44px]">
              {service.title}
            </h1>

            {service.summary ? (
              <p className="mx-auto max-w-xl font-body text-sm text-muted">{service.summary}</p>
            ) : null}
          </header>

          {service.featuredImage ? (
            <div className="relative mx-auto mt-8 aspect-[16/9] w-full max-w-5xl overflow-hidden rounded-[25px] border border-border-strong bg-white/5">
              <Image
                src={service.featuredImage.url}
                alt={service.featuredImage.altText || service.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="object-cover"
              />
            </div>
          ) : null}

          {service.content ? (
            <div className="mx-auto mt-10 max-w-3xl">
              <ArticleContent html={service.content} />
            </div>
          ) : null}
        </Container>
      </article>

      <FAQ />
      <CTABookForm />
    </>
  );
}
