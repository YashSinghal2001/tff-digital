import { z } from "zod";
import type { WPPageInfo } from "@/types/api/wp-connection";
import type { WPMediaItem } from "@/types/api/wp-media";
import type { WPSeo } from "@/types/api/wp-seo";

// Runtime counterparts of the shared WPGraphQL fragments (audit CQ-1).
// Every schema in src/schemas/api mirrors what the query SELECTS, with the
// nullability the src/types/api interfaces declare, and is pinned to that
// interface with `satisfies z.ZodType<...>` so schema and type cannot drift
// apart silently. Zod's default unknown-key stripping is deliberate: an
// additive WPGraphQL/plugin change must not become an outage.
//
// Sibling schema imports are relative with an explicit .ts extension — not
// @/ aliases — so these modules stay loadable under `node --test` (native
// ESM resolution, no alias support), keeping the schemas unit-testable.

export const wpPageInfoSchema = z.object({
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
  startCursor: z.string().nullable(),
  endCursor: z.string().nullable(),
}) satisfies z.ZodType<WPPageInfo>;

/**
 * Shape of a ROOT query connection — the queries select pageInfo there.
 * Nested connections (a post's categories/tags, a case study's
 * relatedServices) select only `nodes`; model those as
 * `z.object({ nodes: z.array(...) })` at the call site instead.
 */
export function wpConnectionSchema<TNode extends z.ZodType>(node: TNode) {
  return z.object({
    nodes: z.array(node),
    pageInfo: wpPageInfoSchema,
  });
}

// Matches the MediaFields fragment. sourceUrl stays non-null on purpose:
// every downstream consumer (next/image src) requires a real string, so a
// broken attachment should surface as a clean boundary error, not render.
export const wpMediaItemSchema = z.object({
  id: z.string(),
  sourceUrl: z.string(),
  altText: z.string().nullable(),
  mediaDetails: z
    .object({
      width: z.number().nullable(),
      height: z.number().nullable(),
    })
    .nullable(),
}) satisfies z.ZodType<WPMediaItem>;

// Matches the SeoFields fragment (WPGraphQL SEO / Yoast bridge) — every
// field nullable, exactly as WPSeo declares.
export const wpSeoSchema = z.object({
  title: z.string().nullable(),
  metaDesc: z.string().nullable(),
  canonical: z.string().nullable(),
  opengraphTitle: z.string().nullable(),
  opengraphDescription: z.string().nullable(),
  opengraphImage: wpMediaItemSchema.nullable(),
  twitterTitle: z.string().nullable(),
  twitterDescription: z.string().nullable(),
  twitterImage: wpMediaItemSchema.nullable(),
  metaRobotsNoindex: z.string().nullable(),
  metaRobotsNofollow: z.string().nullable(),
  schema: z.object({ raw: z.string().nullable() }).nullable(),
}) satisfies z.ZodType<WPSeo>;
