import { z } from "zod";
import {
  wpMediaItemSchema,
  wpConnectionSchema,
  wpSeoSchema,
} from "./wp-shared.schema.ts";
import type {
  WPServiceOffering,
  WPServiceOfferingQueryResult,
  WPServiceOfferingsQueryResult,
} from "@/types/api/wp-service-offering";

// Runtime counterpart of the ServiceFields fragment and the service query
// roots (audit CQ-1). See wp-shared.schema.ts for the conventions.

export const wpServiceOfferingSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  content: z.string().nullable(),
  date: z.string(),
  modified: z.string(),
  featuredImage: z.object({ node: wpMediaItemSchema }).nullable(),
  serviceFields: z
    .object({
      shortDescription: z.string().nullable(),
      description: z.string().nullable(),
      displayOrder: z.number().nullable(),
      icon: z.object({ node: wpMediaItemSchema }).nullable(),
    })
    .nullable(),
  seo: wpSeoSchema.nullable(),
  // Selected only by GET_SERVICE_PREVIEW — absent on public responses,
  // exactly as the interface's optional fields document.
  databaseId: z.number().optional(),
  status: z.string().optional(),
}) satisfies z.ZodType<WPServiceOffering>;

export const wpServiceOfferingsQueryResultSchema = z.object({
  services: wpConnectionSchema(wpServiceOfferingSchema),
}) satisfies z.ZodType<WPServiceOfferingsQueryResult>;

export const wpServiceOfferingQueryResultSchema = z.object({
  service: wpServiceOfferingSchema.nullable(),
}) satisfies z.ZodType<WPServiceOfferingQueryResult>;
