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

// TEMPORARY CONTAINMENT (2026-09-30) — REVERT after the WordPress spam
// cleanup by deleting the `where` argument (back to the default DATE DESC).
// ~3,000 injected posts dated 2026-09-11 with a null `modified` sort ahead
// of every real post by date, so a DATE-ordered page is all spam and the
// repository's per-record validation leaves it empty. MODIFIED DESC sinks
// null-modified records below real ones. Affects every GET_POSTS consumer:
// the /blog listing, the recent/popular sidebars on /blog, post, category
// and tag pages, /blog/[slug] generateStaticParams, and the sitemap. Category,
// tag and search queries are deliberately left on their default order.
export const GET_POSTS = gql`
  query GetPosts($first: Int = 10, $after: String) {
    posts(
      first: $first
      after: $after
      where: { orderby: { field: MODIFIED, order: DESC } }
    ) {
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
