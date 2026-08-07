import { gql } from "@/graphql/gql";
import { MEDIA_FRAGMENT } from "@/graphql/fragments/media.fragment";
import { SEO_FRAGMENT } from "@/graphql/fragments/seo.fragment";
import { SERVICE_FIELDS } from "@/graphql/queries/service-offering.queries";

const CASE_STUDY_FIELDS = gql`
  fragment CaseStudyFields on CaseStudy {
    id
    slug
    title
    excerpt
    content
    date
    modified
    featuredImage {
      node {
        ...MediaFields
      }
    }
    caseStudyFields {
      clientName
      industry
      projectUrl
      shortSummary
      challenge
      solution
      result1Label
      result1Value
      result2Label
      result2Value
      result3Label
      result3Value
      result4Label
      result4Value
      featuredOnHomepage
      relatedServices {
        nodes {
          ... on Service {
            ...ServiceFields
          }
        }
      }
    }
    seo {
      ...SeoFields
    }
  }
  ${MEDIA_FRAGMENT}
  ${SEO_FRAGMENT}
  ${SERVICE_FIELDS}
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
