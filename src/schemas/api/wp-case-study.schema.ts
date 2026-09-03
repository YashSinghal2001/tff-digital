import { z } from "zod";
import {
  wpConnectionSchema,
  wpMediaItemSchema,
  wpSeoSchema,
} from "./wp-shared.schema.ts";
import { wpServiceOfferingSchema } from "./wp-service-offering.schema.ts";
import type {
  WPCaseStudiesQueryResult,
  WPCaseStudy,
  WPCaseStudyQueryResult,
} from "@/types/api/wp-case-study";

// Runtime counterpart of the CaseStudyFields fragment and the case-study
// query roots (audit CQ-1). See wp-shared.schema.ts for the conventions.

const wpCaseStudyFieldsSchema = z.object({
  clientName: z.string().nullable(),
  industry: z.string().nullable(),
  projectUrl: z.string().nullable(),
  shortSummary: z.string().nullable(),
  challenge: z.string().nullable(),
  solution: z.string().nullable(),
  result1Label: z.string().nullable(),
  result1Value: z.string().nullable(),
  result2Label: z.string().nullable(),
  result2Value: z.string().nullable(),
  result3Label: z.string().nullable(),
  result3Value: z.string().nullable(),
  result4Label: z.string().nullable(),
  result4Value: z.string().nullable(),
  featuredOnHomepage: z.boolean().nullable(),
  // Nodes-only nested connection (no pageInfo selected), matching the
  // interface. The `... on Service` inline fragment means a non-Service
  // node would arrive as {} and fail here — a typed boundary error instead
  // of the id-less garbage it would previously have rendered as.
  relatedServices: z
    .object({ nodes: z.array(wpServiceOfferingSchema) })
    .nullable(),
});

export const wpCaseStudySchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  excerpt: z.string().nullable(),
  content: z.string().nullable(),
  date: z.string(),
  modified: z.string(),
  featuredImage: z.object({ node: wpMediaItemSchema }).nullable(),
  caseStudyFields: wpCaseStudyFieldsSchema.nullable(),
  seo: wpSeoSchema.nullable(),
  // Selected only by GET_CASE_STUDY_PREVIEW — absent on public responses,
  // exactly as the interface's optional fields document.
  databaseId: z.number().optional(),
  status: z.string().optional(),
}) satisfies z.ZodType<WPCaseStudy>;

export const wpCaseStudiesQueryResultSchema = z.object({
  caseStudies: wpConnectionSchema(wpCaseStudySchema),
}) satisfies z.ZodType<WPCaseStudiesQueryResult>;

export const wpCaseStudyQueryResultSchema = z.object({
  caseStudy: wpCaseStudySchema.nullable(),
}) satisfies z.ZodType<WPCaseStudyQueryResult>;
