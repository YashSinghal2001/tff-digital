import { gql } from "@/graphql/gql";

export const MEDIA_FRAGMENT = gql`
  fragment MediaFields on MediaItem {
    id
    sourceUrl
    altText
    mediaDetails {
      width
      height
    }
  }
`;
