import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getServiceOfferingBySlug } from "@/services/service-offering.service";
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

export async function generateMetadata({ params }: ServiceDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceOfferingBySlug(slug);
  if (!service) return {};

  // Content-derived fallback so a service without Yoast data still gets its
  // own title/description instead of the site defaults.
  return buildMetadata(service.seo, getCanonicalUrl(ROUTES.service(slug)), {
    title: service.title,
    description: service.summary ? htmlToPlainText(service.summary) : undefined,
  });
}

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const { slug } = await params;
  const service = await getServiceOfferingBySlug(slug);
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
