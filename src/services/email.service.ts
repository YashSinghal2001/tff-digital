import "server-only";
import { getResendClient } from "@/lib/email/resend-client";
import { emailConfig } from "@/config/email.config";
import { EmailError } from "@/lib/email/errors";
import { buildLeadNotificationEmail } from "@/lib/email/templates/lead-notification";
import { buildLeadConfirmationEmail } from "@/lib/email/templates/lead-confirmation";
import type { Lead } from "@/types/domain/lead";

/**
 * Sends the client/agency notification and the lead's confirmation email
 * for an already-persisted lead. Never throws: the lead is already saved by
 * the time this runs, so an email failure must not surface as a failed form
 * submission. Each send is independent (one failing doesn't stop the other)
 * and every failure is logged server-side only — no provider detail ever
 * reaches the browser.
 */
export async function sendLeadEmails(lead: Lead): Promise<void> {
  const results = await Promise.allSettled([
    sendLeadNotificationEmail(lead),
    sendLeadConfirmationEmail(lead),
  ]);

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[email.service] Failed to send lead email", result.reason);
    }
  }
}

async function sendLeadNotificationEmail(lead: Lead): Promise<void> {
  const { emailFrom, leadNotificationEmail } = emailConfig;
  if (!emailFrom || !leadNotificationEmail) {
    throw new EmailError(
      "EMAIL_FROM or LEAD_NOTIFICATION_EMAIL is not configured.",
      "config",
    );
  }

  const resend = getResendClient();
  const { subject, html, text, replyTo } = buildLeadNotificationEmail(lead);

  const { error } = await resend.emails.send({
    from: emailFrom,
    to: leadNotificationEmail,
    replyTo,
    subject,
    html,
    text,
  });

  if (error) {
    throw new EmailError(error.message ?? "Resend API returned an error", "http");
  }
}

async function sendLeadConfirmationEmail(lead: Lead): Promise<void> {
  const { emailFrom } = emailConfig;
  if (!emailFrom) {
    throw new EmailError("EMAIL_FROM is not configured.", "config");
  }

  const resend = getResendClient();
  const { subject, html, text } = buildLeadConfirmationEmail(lead);

  const { error } = await resend.emails.send({
    from: emailFrom,
    to: lead.email,
    subject,
    html,
    text,
  });

  if (error) {
    throw new EmailError(error.message ?? "Resend API returned an error", "http");
  }
}
