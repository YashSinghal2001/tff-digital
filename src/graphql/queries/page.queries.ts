import { gql } from "@/graphql/gql";
import { MEDIA_FRAGMENT } from "@/graphql/fragments/media.fragment";
import { SEO_FRAGMENT } from "@/graphql/fragments/seo.fragment";

export const GET_PAGE_BY_SLUG = gql`
  query GetPageBySlug($slug: ID!) {
    page(id: $slug, idType: URI) {
      id
      slug
      title
      content
      featuredImage {
        node {
          ...MediaFields
        }
      }
      seo {
        ...SeoFields
      }
    }
  }
  ${MEDIA_FRAGMENT}
  ${SEO_FRAGMENT}
`;
