import { gql } from "@/graphql/gql";
import { MEDIA_FRAGMENT } from "@/graphql/fragments/media.fragment";
import { SEO_FRAGMENT } from "@/graphql/fragments/seo.fragment";

const SERVICE_FIELDS = gql`
  fragment ServiceFields on Service {
    id
    slug
    title
    content
    summary
    icon {
      ...MediaFields
    }
    featuredImage {
      node {
        ...MediaFields
      }
    }
    menuOrder
    seo {
      ...SeoFields
    }
  }
  ${MEDIA_FRAGMENT}
  ${SEO_FRAGMENT}
`;

export const GET_SERVICES = gql`
  query GetServices($first: Int = 20, $after: String) {
    services(first: $first, after: $after) {
      nodes {
        ...ServiceFields
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
  ${SERVICE_FIELDS}
`;

export const GET_SERVICE_BY_SLUG = gql`
  query GetServiceBySlug($slug: ID!) {
    service(id: $slug, idType: SLUG) {
      ...ServiceFields
    }
  }
  ${SERVICE_FIELDS}
`;
