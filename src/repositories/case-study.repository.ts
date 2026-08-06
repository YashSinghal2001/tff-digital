import "server-only";
import { fetchGraphQL } from "@/lib/wordpress/client";
import {
  GET_CASE_STUDIES,
  GET_CASE_STUDY_BY_SLUG,
} from "@/graphql/queries/case-study.queries";
import type {
  WPCaseStudiesQueryResult,
  WPCaseStudyQueryResult,
} from "@/types/api/wp-case-study";

export function findAllCaseStudies(variables?: {
  first?: number;
  after?: string;
}) {
  return fetchGraphQL<WPCaseStudiesQueryResult>(GET_CASE_STUDIES, variables);
}

export function findCaseStudyBySlug(slug: string) {
  return fetchGraphQL<WPCaseStudyQueryResult>(GET_CASE_STUDY_BY_SLUG, {
    slug,
  });
}
