import { z } from "zod";
import type {
  WPMenu,
  WPMenuItem,
  WPMenuQueryResult,
} from "@/types/api/wp-menu";

// Runtime counterpart of the MenuItemFields fragment and the
// GetMenuByLocation query root (audit CQ-1). See wp-shared.schema.ts for
// the conventions. Every connection here is nodes-only (no pageInfo
// selected), and the query nests exactly one level: a child item selects
// MenuItemFields only, so it carries no childItems key.

const wpMenuItemFieldsSchema = z.object({
  id: z.string(),
  label: z.string(),
  url: z.string(),
  target: z.string().nullable(),
});

export const wpMenuItemSchema = wpMenuItemFieldsSchema.extend({
  childItems: z
    .object({ nodes: z.array(wpMenuItemFieldsSchema) })
    .nullable()
    .optional(),
}) satisfies z.ZodType<WPMenuItem>;

export const wpMenuSchema = z.object({
  name: z.string(),
  menuItems: z.object({ nodes: z.array(wpMenuItemSchema) }),
}) satisfies z.ZodType<WPMenu>;

export const wpMenuQueryResultSchema = z.object({
  menus: z.object({ nodes: z.array(wpMenuSchema) }),
}) satisfies z.ZodType<WPMenuQueryResult>;
