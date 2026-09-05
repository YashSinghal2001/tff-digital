import { gql } from "@/graphql/gql";
import { MEDIA_FRAGMENT } from "@/graphql/fragments/media.fragment";
import { SEO_FRAGMENT } from "@/graphql/fragments/seo.fragment";

export const PAGE_FIELDS = gql`
  fragment PageFields on Page {
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
  ${MEDIA_FRAGMENT}
  ${SEO_FRAGMENT}
`;

export const GET_PAGE_BY_SLUG = gql`
  query GetPageBySlug($slug: ID!) {
    page(id: $slug, idType: URI) {
      ...PageFields
    }
  }
  ${PAGE_FIELDS}
`;

export const GET_PAGES = gql`
  query GetPages($first: Int = 50, $after: String) {
    pages(first: $first, after: $after) {
      nodes {
        ...PageFields
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
  ${PAGE_FIELDS}
`;
