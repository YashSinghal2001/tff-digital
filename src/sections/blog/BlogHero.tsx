import { PageHero } from "@/components/common/PageHero";
import { Container } from "@/components/ui/Container";
import { GradientText } from "@/components/ui/GradientText";
import { BlogSearch } from "@/components/blog/BlogSearch";

export interface BlogHeroProps {
  defaultQuery?: string;
}

export function BlogHero({ defaultQuery }: BlogHeroProps) {
  return (
    <>
      <PageHero
        eyebrow="BLOG"
        heading={
          <>
            Insights for <GradientText>ambitious growth teams.</GradientText>
          </>
        }
        description={[
          "Strategy, SEO, and performance marketing lessons from the team building TFF Digital.",
        ]}
      />
      <div className="pb-10">
        <Container size="full" className="max-w-[1280px]">
          <div className="mx-auto max-w-xl">
            <BlogSearch defaultValue={defaultQuery} />
          </div>
        </Container>
      </div>
    </>
  );
}
