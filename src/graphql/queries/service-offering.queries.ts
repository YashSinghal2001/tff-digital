import { gql } from "@/graphql/gql";
import { MEDIA_FRAGMENT } from "@/graphql/fragments/media.fragment";
import { SEO_FRAGMENT } from "@/graphql/fragments/seo.fragment";

export const SERVICE_FIELDS = gql`
  fragment ServiceFields on Service {
    id
    slug
    title
    content
    date
    modified
    featuredImage {
      node {
        ...MediaFields
      }
    }
    serviceFields {
      shortDescription
      description
      displayOrder
      features
      icon {
        node {
          ...MediaFields
        }
      }
      customHtmlContent
      # faqs { question answer } — pending: WPGraphQL rejects this field today
      # ("Cannot query field \"faqs\" on type \"ServiceFields\"", verified live
      # against cms.tffdigital.com), which fails this ENTIRE query, not just
      # the FAQ data. Add it back once the ACF repeater is added to the
      # Service field group in wp-admin and exposed to GraphQL — the
      # type/schema/adapter/page support for it already exists and needs no
      # other change.
    }
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

// Preview-only — mirrors GET_CASE_STUDY_PREVIEW exactly (see that query's
// comment for the asPreview/authentication rationale, which applies
// identically here; live-verified this WPGraphQL install supports
// idType: DATABASE_ID + asPreview on the service query the same way).
export const GET_SERVICE_PREVIEW = gql`
  query GetServicePreview($id: ID!, $idType: ServiceIdType!, $asPreview: Boolean) {
    service(id: $id, idType: $idType, asPreview: $asPreview) {
      databaseId
      status
      ...ServiceFields
    }
  }
  ${SERVICE_FIELDS}
`;
