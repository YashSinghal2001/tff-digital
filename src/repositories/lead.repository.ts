import "server-only";
import { postToWordPress } from "@/lib/wordpress/rest-client";
import { WP_REST_ENDPOINTS } from "@/constants/api";
import type { WPLeadRequestBody, WPLeadResponse } from "@/types/api/wp-lead";

export function createLead(body: WPLeadRequestBody) {
  return postToWordPress<WPLeadResponse, WPLeadRequestBody>(
    WP_REST_ENDPOINTS.leads,
    body,
  );
}
