import "server-only";
import { createLead } from "@/repositories/lead.repository";
import {
  contactFormSchema,
  type ContactFormValues,
} from "@/schemas/forms/contact.schema";
import { wpLeadResponseSchema } from "@/schemas/api/lead.schema";
import type { LeadSubmissionResult } from "@/types/domain/lead";

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

  return {
    success: response.status === "success",
    message: response.message ?? "",
  };
}
