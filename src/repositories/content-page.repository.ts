import "server-only";
import { fetchGraphQL } from "@/lib/wordpress/client";
import { GET_PAGE_BY_SLUG } from "@/graphql/queries/page.queries";
import type { WPPageQueryResult } from "@/types/api/wp-page";

export function findPageBySlug(slug: string) {
  return fetchGraphQL<WPPageQueryResult>(GET_PAGE_BY_SLUG, { slug });
}
