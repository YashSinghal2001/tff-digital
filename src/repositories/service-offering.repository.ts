import "server-only";
import { fetchGraphQL } from "@/lib/wordpress/client";
import {
  GET_SERVICE_BY_SLUG,
  GET_SERVICES,
} from "@/graphql/queries/service-offering.queries";
import type {
  WPServiceOfferingQueryResult,
  WPServiceOfferingsQueryResult,
} from "@/types/api/wp-service-offering";

export function findAllServiceOfferings(variables?: {
  first?: number;
  after?: string;
}) {
  return fetchGraphQL<WPServiceOfferingsQueryResult>(GET_SERVICES, variables);
}

export function findServiceOfferingBySlug(slug: string) {
  return fetchGraphQL<WPServiceOfferingQueryResult>(GET_SERVICE_BY_SLUG, {
    slug,
  });
}
