import { z } from "zod";
import {
  wpConnectionSchema,
  wpMediaItemSchema,
  wpSeoSchema,
} from "./wp-shared.schema.ts";
import type {
  WPPage,
  WPPageQueryResult,
  WPPagesQueryResult,
} from "@/types/api/wp-page";

// Runtime counterpart of the GetPageBySlug/GetPages selections (audit
// CQ-1). See wp-shared.schema.ts for the conventions. `content` is
// nullable — confirmed against the live CMS (CLIENT-1): a Page with an
// empty body returns `content: null`, not "", the same as every other
// WordPress post type's free-text fields elsewhere in this codebase.

export const wpPageSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  content: z.string().nullable(),
  featuredImage: z.object({ node: wpMediaItemSchema }).nullable(),
  seo: wpSeoSchema.nullable(),
}) satisfies z.ZodType<WPPage>;

export const wpPageQueryResultSchema = z.object({
  page: wpPageSchema.nullable(),
}) satisfies z.ZodType<WPPageQueryResult>;

export const wpPagesQueryResultSchema = z.object({
  pages: wpConnectionSchema(wpPageSchema),
}) satisfies z.ZodType<WPPagesQueryResult>;
