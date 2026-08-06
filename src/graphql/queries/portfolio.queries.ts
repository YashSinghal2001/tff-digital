import { gql } from "@/graphql/gql";
import { MEDIA_FRAGMENT } from "@/graphql/fragments/media.fragment";
import { SEO_FRAGMENT } from "@/graphql/fragments/seo.fragment";
import { CATEGORY_FRAGMENT } from "@/graphql/fragments/taxonomy.fragment";

const PORTFOLIO_ITEM_FIELDS = gql`
  fragment PortfolioItemFields on PortfolioItem {
    id
    slug
    title
    content
    summary
    client
    featuredImage {
      node {
        ...MediaFields
      }
    }
    gallery {
      ...MediaFields
    }
    categories {
      nodes {
        ...CategoryFields
      }
    }
    seo {
      ...SeoFields
    }
  }
  ${MEDIA_FRAGMENT}
  ${CATEGORY_FRAGMENT}
  ${SEO_FRAGMENT}
`;

export const GET_PORTFOLIO_ITEMS = gql`
  query GetPortfolioItems($first: Int = 20, $after: String) {
    portfolioItems(first: $first, after: $after) {
      nodes {
        ...PortfolioItemFields
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
  ${PORTFOLIO_ITEM_FIELDS}
`;

export const GET_PORTFOLIO_ITEM_BY_SLUG = gql`
  query GetPortfolioItemBySlug($slug: ID!) {
    portfolioItem(id: $slug, idType: SLUG) {
      ...PortfolioItemFields
    }
  }
  ${PORTFOLIO_ITEM_FIELDS}
`;
