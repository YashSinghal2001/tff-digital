import { z } from "zod";
import {
  wpConnectionSchema,
  wpMediaItemSchema,
  wpSeoSchema,
} from "./wp-shared.schema.ts";
import { wpCategorySchema, wpTagSchema } from "./wp-taxonomy.schema.ts";
import type { WPAuthor } from "@/types/api/wp-author";
import type {
  WPPost,
  WPPostQueryResult,
  WPPostsQueryResult,
} from "@/types/api/wp-post";

// Runtime counterpart of the PostFields fragment and the post query roots
// (audit CQ-1). See wp-shared.schema.ts for the conventions.

const wpAuthorSchema = z.object({
  node: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    avatar: z.object({ url: z.string() }).nullable(),
    description: z.string().nullable(),
  }),
}) satisfies z.ZodType<WPAuthor>;

export const wpPostSchema = z.object({
  id: z.string(),
  databaseId: z.number(),
  slug: z.string(),
  title: z.string(),
  excerpt: z.string().nullable(),
  content: z.string().nullable(),
  date: z.string(),
  modified: z.string(),
  featuredImage: z.object({ node: wpMediaItemSchema }).nullable(),
  author: wpAuthorSchema.nullable(),
  // Nodes-only: PostFields selects no pageInfo on these nested connections
  // (see the matching note in src/types/api/wp-post.ts).
  categories: z.object({ nodes: z.array(wpCategorySchema) }).nullable(),
  tags: z.object({ nodes: z.array(wpTagSchema) }).nullable(),
  seo: wpSeoSchema.nullable(),
}) satisfies z.ZodType<WPPost>;

export const wpPostsQueryResultSchema = z.object({
  posts: wpConnectionSchema(wpPostSchema),
}) satisfies z.ZodType<WPPostsQueryResult>;

export const wpPostQueryResultSchema = z.object({
  post: wpPostSchema.nullable(),
}) satisfies z.ZodType<WPPostQueryResult>;
