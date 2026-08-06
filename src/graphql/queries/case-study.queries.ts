import { gql } from "@/graphql/gql";
import { MEDIA_FRAGMENT } from "@/graphql/fragments/media.fragment";
import { SEO_FRAGMENT } from "@/graphql/fragments/seo.fragment";

const CASE_STUDY_FIELDS = gql`
  fragment CaseStudyFields on CaseStudy {
    id
    slug
    title
    content
    summary
    client
    industry
    featuredImage {
      node {
        ...MediaFields
      }
    }
    metrics {
      label
      value
    }
    relatedServices {
      id
      slug
      title
      summary
      menuOrder
      icon {
        ...MediaFields
      }
      featuredImage {
        node {
          ...MediaFields
        }
      }
      seo {
        ...SeoFields
      }
    }
    seo {
      ...SeoFields
    }
  }
  ${MEDIA_FRAGMENT}
  ${SEO_FRAGMENT}
`;

export const GET_CASE_STUDIES = gql`
  query GetCaseStudies($first: Int = 20, $after: String) {
    caseStudies(first: $first, after: $after) {
      nodes {
        ...CaseStudyFields
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
  ${CASE_STUDY_FIELDS}
`;

export const GET_CASE_STUDY_BY_SLUG = gql`
  query GetCaseStudyBySlug($slug: ID!) {
    caseStudy(id: $slug, idType: SLUG) {
      ...CaseStudyFields
    }
  }
  ${CASE_STUDY_FIELDS}
`;
