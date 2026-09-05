import "server-only";
import { fetchGraphQL } from "@/lib/wordpress/client";
import { parseWordPressResponse } from "@/lib/wordpress/parse-response";
import { wpMenuQueryResultSchema } from "@/schemas/api/wp-menu.schema";
import { GET_MENU_BY_LOCATION } from "@/graphql/queries/navigation.queries";
import type { WPMenuQueryResult } from "@/types/api/wp-menu";

// Responses validated at the boundary (audit CQ-1) — see
// src/lib/wordpress/parse-response.ts and post.repository.ts.

export async function findMenuByLocation(
  location: string,
): Promise<WPMenuQueryResult> {
  return parseWordPressResponse(
    wpMenuQueryResultSchema,
    await fetchGraphQL(GET_MENU_BY_LOCATION, { location }),
    "GetMenuByLocation",
  );
}
