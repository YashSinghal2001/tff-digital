import { gql } from "@/graphql/gql";
import { MEDIA_FRAGMENT } from "@/graphql/fragments/media.fragment";

export const SEO_FRAGMENT = gql`
  fragment SeoFields on PostTypeSEO {
    title
    metaDesc
    canonical
    opengraphTitle
    opengraphDescription
    opengraphImage {
      ...MediaFields
    }
    twitterTitle
    twitterDescription
    twitterImage {
      ...MediaFields
    }
    metaRobotsNoindex
    metaRobotsNofollow
    schema {
      raw
    }
  }
  ${MEDIA_FRAGMENT}
`;
