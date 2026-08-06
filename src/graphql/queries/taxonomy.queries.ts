import { gql } from "@/graphql/gql";
import { CATEGORY_FRAGMENT, TAG_FRAGMENT } from "@/graphql/fragments/taxonomy.fragment";

export const GET_CATEGORIES = gql`
  query GetCategories($first: Int = 50) {
    categories(first: $first, where: { hideEmpty: true }) {
      nodes {
        ...CategoryFields
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
  ${CATEGORY_FRAGMENT}
`;

export const GET_TAGS = gql`
  query GetTags($first: Int = 50) {
    tags(first: $first, where: { hideEmpty: true }) {
      nodes {
        ...TagFields
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
  ${TAG_FRAGMENT}
`;
