import { gql } from "@/graphql/gql";

export const AUTHOR_FRAGMENT = gql`
  fragment AuthorFields on User {
    id
    name
    slug
    avatar {
      url
    }
    description
  }
`;
