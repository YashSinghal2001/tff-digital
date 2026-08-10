import "server-only";
import { createLead } from "@/repositories/lead.repository";
import {
  contactFormSchema,
  type ContactFormValues,
} from "@/schemas/forms/contact.schema";
import { wpLeadResponseSchema } from "@/schemas/api/lead.schema";
import type { Lead, LeadSubmissionResult } from "@/types/domain/lead";
import { sendLeadEmails } from "@/services/email.service";

export async function submitContactForm(
  values: ContactFormValues,
): Promise<LeadSubmissionResult> {
  const parsed = contactFormSchema.parse(values);

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

  const response = wpLeadResponseSchema.parse(rawResponse);
  const success = response.status === "success";

  // Only notify once the lead is durably saved in WordPress. Email delivery
  // is a best-effort side effect from here on — sendLeadEmails never throws,
  // so a Resend failure can't turn an already-successful submission into an
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
