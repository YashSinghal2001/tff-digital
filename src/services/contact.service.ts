import "server-only";
import { createLead } from "@/repositories/lead.repository";
import {
  contactFormSchema,
  type ContactFormValues,
} from "@/schemas/forms/contact.schema";
import { wpLeadResponseSchema } from "@/schemas/api/lead.schema";
import type { Lead, LeadSubmissionResult } from "@/types/domain/lead";
import { sendLeadEmails } from "@/services/email.service";
import { isHoneypotFilled } from "@/lib/forms/honeypot";
import { parseWordPressResponse } from "@/lib/wordpress/parse-response";

export async function submitContactForm(
  values: ContactFormValues,
): Promise<LeadSubmissionResult> {
  const parsed = contactFormSchema.parse(values);

  // Honeypot check (audit FORM-2). Enforced here, not in the client or the
  // Server Action wrapper, so no request path can skip it — hiding or
  // deleting the field in the browser changes nothing, the server only ever
  // looks at the submitted value. Dropped silently with the ordinary success
  // shape: an error response would tell a bot which field to leave alone
  // next time, and nothing is persisted or emailed either way.
  if (isHoneypotFilled(parsed.website)) {
    console.warn(
      "[contact.service] Honeypot filled — submission dropped as spam",
    );
    return { success: true, message: "" };
  }

  const rawResponse = await createLead({
    name: parsed.name,
    email: parsed.email,
    phone: parsed.phone,
    company: parsed.company,
    service_interest: parsed.serviceInterest,
    budget: parsed.budget,
    message: parsed.message,
    source: "website",
  });

  // Through the shared boundary helper, not a bare .parse (audit
  // FORM-RT-1): a raw ZodError here would be misread by the Server
  // Action's `instanceof ZodError` branch as a form-input failure —
  // "check the highlighted fields" for a malformed WordPress response.
  // WordPressError(kind "parse") routes it to the server-error branch,
  // which also carries the MONITOR-1 log line.
  const response = parseWordPressResponse(
    wpLeadResponseSchema,
    rawResponse,
    "createLead",
  );
  const success = response.status === "success";

  // Only notify once the lead is durably saved in WordPress. Email delivery
  // is a best-effort side effect from here on — sendLeadEmails never throws,
  // so an SMTP failure can't turn an already-successful submission into an
  // error response (see src/services/email.service.ts).
  if (success) {
    const lead: Lead = {
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone ?? null,
      company: parsed.company ?? null,
      serviceInterest: parsed.serviceInterest,
      budget: parsed.budget,
      message: parsed.message,
      source: "website",
      submittedAt: new Date().toISOString(),
    };

    await sendLeadEmails(lead);
  }

  return {
    success,
    message: response.message ?? "",
  };
}
