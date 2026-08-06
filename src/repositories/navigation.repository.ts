import "server-only";
import { fetchGraphQL } from "@/lib/wordpress/client";
import { GET_MENU_BY_LOCATION } from "@/graphql/queries/navigation.queries";
import type { WPMenuQueryResult } from "@/types/api/wp-menu";

export function findMenuByLocation(location: string) {
  return fetchGraphQL<WPMenuQueryResult>(GET_MENU_BY_LOCATION, { location });
}
