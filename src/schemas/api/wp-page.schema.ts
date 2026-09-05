import { z } from "zod";
import { wpMediaItemSchema, wpSeoSchema } from "./wp-shared.schema.ts";
import type { WPPage, WPPageQueryResult } from "@/types/api/wp-page";

// Runtime counterpart of the GetPageBySlug selection (audit CQ-1). See
// wp-shared.schema.ts for the conventions. Nullability mirrors WPPage
// exactly — `content` is declared non-null there, so it stays required.

export const wpPageSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  content: z.string(),
  featuredImage: z.object({ node: wpMediaItemSchema }).nullable(),
  seo: wpSeoSchema.nullable(),
}) satisfies z.ZodType<WPPage>;

export const wpPageQueryResultSchema = z.object({
  page: wpPageSchema.nullable(),
}) satisfies z.ZodType<WPPageQueryResult>;
