import "server-only";
import type { Lead } from "@/types/domain/lead";
import { serviceOptions } from "@/constants/contact-form";
import { labelFor } from "@/lib/email/templates/lead-notification";
import { escapeHtml } from "@/lib/email/sanitize";

export interface LeadConfirmationEmail {
  subject: string;
  html: string;
  text: string;
}

/** Sent to the lead themselves — must never include internal/admin details. */
export function buildLeadConfirmationEmail(lead: Lead): LeadConfirmationEmail {
  const serviceLabel = labelFor(serviceOptions, lead.serviceInterest);
  const firstName = lead.name.trim().split(/\s+/)[0] || lead.name;

  const html = `
    <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111111;">
      <p>Hi ${escapeHtml(firstName)},</p>
      <p>Thanks for reaching out to Target Find Finish.</p>
      <p>We&rsquo;ve received your enquiry and our team will review your requirements and get back to you shortly.</p>
      <p style="font-weight: bold; margin: 20px 0 4px;">Your enquiry details</p>
      <p style="margin: 4px 0;"><strong>Service:</strong> ${escapeHtml(serviceLabel)}</p>
      <p style="margin: 4px 0; white-space: pre-wrap;"><strong>Message:</strong><br />${escapeHtml(lead.message)}</p>
      <p style="margin-top: 24px;">
        Regards,<br />
        Target Find Finish<br />
        Digital Growth Agency
      </p>
    </div>
  `;

  const text = [
    `Hi ${firstName},`,
    "",
    "Thanks for reaching out to Target Find Finish.",
    "",
    "We've received your enquiry and our team will review your requirements and get back to you shortly.",
    "",
    "Your enquiry details:",
    "",
    `Service: ${serviceLabel}`,
    "",
    "Message:",
    lead.message,
    "",
    "Regards,",
    "Target Find Finish",
    "Digital Growth Agency",
  ].join("\n");

  return {
    subject: "Thanks for reaching out to Target Find Finish",
    html,
    text,
  };
}
