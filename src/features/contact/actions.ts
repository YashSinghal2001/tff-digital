"use server";

import { ZodError } from "zod";
import { submitContactForm } from "@/services/contact.service";
import type { ContactFormValues } from "@/schemas/forms/contact.schema";
import { isWordPressError } from "@/lib/wordpress/errors";
import type { LeadSubmissionResult } from "@/types/domain/lead";

/**
 * Server Action: RHF -> Zod -> here -> WordPress REST -> Leads CPT.
 * Never throws across the server/client boundary — always resolves to a
 * typed result so the form can show a real error state instead of
 * Next.js's generic error overlay.
 */
export async function submitContactFormAction(
  values: ContactFormValues,
): Promise<LeadSubmissionResult> {
  try {
    return await submitContactForm(values);
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        message: "Please check the highlighted fields and try again.",
      };
    }

    if (isWordPressError(error)) {
      // The lead was NOT saved. Without this line a WordPress-save failure
      // left zero server-side trace (audit MONITOR-1); the prefix keeps it
      // distinguishable from [email.service]'s delivery-failure logs. Never
      // log the submitted form values — kind + message carry no PII.
      console.error("submitContactFormAction: lead not saved to WordPress", {
        kind: error.kind,
        message: error.message,
      });

      if (error.kind === "config") {
        return {
          success: false,
          message:
            "The contact form isn't connected to WordPress yet. Please email us directly in the meantime.",
        };
      }
      if (error.kind === "parse") {
        // Reached-but-garbled (audit FORM-RT-1): "couldn't reach" would
        // misattribute a malformed WordPress response as a network problem.
        return {
          success: false,
          message:
            "Our server sent back an unexpected response. Please try again in a moment.",
        };
      }
      return {
        success: false,
        message: "We couldn't reach our server just now. Please try again in a moment.",
      };
    }

    console.error("submitContactFormAction: unexpected error", error);
    return {
      success: false,
      message: "Something went wrong sending your message. Please try again.",
    };
  }
}
