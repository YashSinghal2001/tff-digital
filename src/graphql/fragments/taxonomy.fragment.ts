import { gql } from "@/graphql/gql";

export const CATEGORY_FRAGMENT = gql`
  fragment CategoryFields on Category {
    id
    name
    slug
    count
  }
`;

export const TAG_FRAGMENT = gql`
  fragment TagFields on Tag {
    id
    name
    slug
  }
`;
