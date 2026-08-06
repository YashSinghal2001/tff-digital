import { gql } from "@/graphql/gql";
import { MEDIA_FRAGMENT } from "@/graphql/fragments/media.fragment";
import { SEO_FRAGMENT } from "@/graphql/fragments/seo.fragment";
import { AUTHOR_FRAGMENT } from "@/graphql/fragments/author.fragment";
import {
  CATEGORY_FRAGMENT,
  TAG_FRAGMENT,
} from "@/graphql/fragments/taxonomy.fragment";

const POST_FIELDS = gql`
  fragment PostFields on Post {
    id
    databaseId
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
    author {
      node {
        ...AuthorFields
      }
    }
    categories {
      nodes {
        ...CategoryFields
      }
    }
    tags {
      nodes {
        ...TagFields
      }
    }
    seo {
      ...SeoFields
    }
  }
  ${MEDIA_FRAGMENT}
  ${AUTHOR_FRAGMENT}
  ${CATEGORY_FRAGMENT}
  ${TAG_FRAGMENT}
  ${SEO_FRAGMENT}
`;

export const GET_POSTS = gql`
  query GetPosts($first: Int = 10, $after: String) {
    posts(first: $first, after: $after) {
      nodes {
        ...PostFields
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
  ${POST_FIELDS}
`;

export const GET_POST_BY_SLUG = gql`
  query GetPostBySlug($slug: ID!) {
    post(id: $slug, idType: SLUG) {
      ...PostFields
    }
  }
  ${POST_FIELDS}
`;

export const GET_POSTS_BY_CATEGORY = gql`
  query GetPostsByCategory($categorySlug: String!, $first: Int = 10, $after: String) {
    posts(first: $first, after: $after, where: { categoryName: $categorySlug }) {
      nodes {
        ...PostFields
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
  ${POST_FIELDS}
`;

export const GET_POSTS_BY_TAG = gql`
  query GetPostsByTag($tagSlug: String!, $first: Int = 10, $after: String) {
    posts(first: $first, after: $after, where: { tag: $tagSlug }) {
      nodes {
        ...PostFields
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
  ${POST_FIELDS}
`;

export const GET_POSTS_SEARCH = gql`
  query GetPostsSearch($search: String!, $first: Int = 10, $after: String) {
    posts(first: $first, after: $after, where: { search: $search }) {
      nodes {
        ...PostFields
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
  ${POST_FIELDS}
`;
