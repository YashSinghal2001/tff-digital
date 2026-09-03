import { z } from "zod";
import { wpConnectionSchema } from "./wp-shared.schema.ts";
import type {
  WPCategoriesQueryResult,
  WPCategory,
  WPTag,
  WPTagsQueryResult,
} from "@/types/api/wp-taxonomy";

// Runtime counterparts of the CategoryFields/TagFields fragments and the
// GetCategories/GetTags query roots (audit CQ-1). See wp-shared.schema.ts
// for the conventions all these schemas follow.

export const wpCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  count: z.number().nullable(),
}) satisfies z.ZodType<WPCategory>;

export const wpTagSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
}) satisfies z.ZodType<WPTag>;

export const wpCategoriesQueryResultSchema = z.object({
  categories: wpConnectionSchema(wpCategorySchema),
}) satisfies z.ZodType<WPCategoriesQueryResult>;

export const wpTagsQueryResultSchema = z.object({
  tags: wpConnectionSchema(wpTagSchema),
}) satisfies z.ZodType<WPTagsQueryResult>;
