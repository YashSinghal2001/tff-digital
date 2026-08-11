import "server-only";
import type { Lead } from "@/types/domain/lead";
import { serviceOptions, budgetOptions } from "@/constants/contact-form";
import { escapeHtml, sanitizeHeaderValue } from "@/lib/email/sanitize";

export interface LeadNotificationEmail {
  subject: string;
  html: string;
  text: string;
  replyTo: string;
}

export function labelFor(options: { label: string; value: string }[], value: string | null): string {
  if (!value) return "Not specified";
  return options.find((option) => option.value === value)?.label ?? value;
}

/** Client/agency-facing notification for a newly persisted lead. */
export function buildLeadNotificationEmail(lead: Lead): LeadNotificationEmail {
  const serviceLabel = labelFor(serviceOptions, lead.serviceInterest);
  const budgetLabel = labelFor(budgetOptions, lead.budget);
  const safeName = sanitizeHeaderValue(lead.name);
  const safeEmail = sanitizeHeaderValue(lead.email);
  const submittedAtLabel = `${new Date(lead.submittedAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  })} UTC`;

  const rows: [string, string][] = [
    ["Name", lead.name],
    ["Email", lead.email],
    ["Phone", lead.phone ?? "Not provided"],
    ["Company", lead.company ?? "Not provided"],
    ["Service", serviceLabel],
    ["Budget", budgetLabel],
    ["Source", lead.source ?? "Not specified"],
    ["Submitted", submittedAtLabel],
  ];

  const html = `
    <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111111;">
      <h2 style="margin: 0 0 16px;">New Website Lead</h2>
      <table style="width: 100%; border-collapse: collapse;">
        ${rows
          .map(
            ([label, value]) => `
          <tr>
            <td style="padding: 8px 12px 8px 0; font-weight: bold; color: #555555; width: 110px; vertical-align: top;">${escapeHtml(label)}</td>
            <td style="padding: 8px 0; color: #111111;">${escapeHtml(value)}</td>
          </tr>`,
          )
          .join("")}
      </table>
      <p style="font-weight: bold; color: #555555; margin: 20px 0 4px;">Message</p>
      <p style="white-space: pre-wrap; margin: 0;">${escapeHtml(lead.message)}</p>
      <p style="margin-top: 24px;">
        <a href="mailto:${encodeURIComponent(lead.email)}" style="color: #2563eb;">Reply to ${escapeHtml(lead.name)}</a>
      </p>
    </div>
  `;

  const text = [
    "NEW WEBSITE LEAD",
    "",
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    `Phone: ${lead.phone ?? "Not provided"}`,
    `Company: ${lead.company ?? "Not provided"}`,
    `Service: ${serviceLabel}`,
    `Budget: ${budgetLabel}`,
    `Source: ${lead.source ?? "Not specified"}`,
    `Submitted: ${submittedAtLabel}`,
    "",
    "Message:",
    lead.message,
  ].join("\n");

  return {
    subject: `New Lead — ${safeName} — ${serviceLabel}`,
    html,
    text,
    // safeEmail guards against header injection defense-in-depth, even
    // though Zod's email() format already rejects embedded CR/LF.
    replyTo: `${safeName} <${safeEmail}>`,
  };
}
