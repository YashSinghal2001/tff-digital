import "server-only";
import { fetchGraphQL } from "@/lib/wordpress/client";
import { parseWordPressResponse } from "@/lib/wordpress/parse-response";
import { wpPageQueryResultSchema } from "@/schemas/api/wp-page.schema";
import { GET_PAGE_BY_SLUG } from "@/graphql/queries/page.queries";
import type { WPPageQueryResult } from "@/types/api/wp-page";

// Responses validated at the boundary (audit CQ-1) — see
// src/lib/wordpress/parse-response.ts and post.repository.ts.

export async function findPageBySlug(slug: string): Promise<WPPageQueryResult> {
  return parseWordPressResponse(
    wpPageQueryResultSchema,
    await fetchGraphQL(GET_PAGE_BY_SLUG, { slug }),
    "GetPageBySlug",
  );
}
