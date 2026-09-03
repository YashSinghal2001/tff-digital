import "server-only";
import { getSmtpTransporter } from "@/lib/email/smtp-client";
import { emailConfig } from "@/config/email.config";
import { EmailError } from "@/lib/email/errors";
import { buildLeadNotificationEmail } from "@/lib/email/templates/lead-notification";
import { buildLeadConfirmationEmail } from "@/lib/email/templates/lead-confirmation";
import type { Lead } from "@/types/domain/lead";

const SEND_LABELS = ["notification", "confirmation"] as const;

/**
 * Sends the client/agency notification and the lead's confirmation email
 * for an already-persisted lead. Never throws: the lead is already saved by
 * the time this runs, so an email failure must not surface as a failed form
 * submission. Each send is independent (one failing doesn't stop the other)
 * and every failure is logged server-side only — no provider detail ever
 * reaches the browser.
 */
export async function sendLeadEmails(lead: Lead): Promise<void> {
  const { smtpHost, smtpPort, smtpSecure, smtpUser, smtpPassword, emailFrom, leadNotificationEmail } =
    emailConfig;
  console.log("[email.service] Sending lead emails", {
    smtpHost,
    smtpPort,
    smtpSecure,
    smtpUser,
    smtpPasswordSet: Boolean(smtpPassword),
    emailFrom,
    leadNotificationEmail,
  });

  const results = await Promise.allSettled([
    sendLeadNotificationEmail(lead),
    sendLeadConfirmationEmail(lead),
  ]);

  results.forEach((result, index) => {
    if (result.status !== "rejected") return;

    const reason = result.reason;
    const cause = reason instanceof EmailError ? reason.cause : undefined;
    const nodemailerError = cause as
      | (Error & { code?: string; responseCode?: number; command?: string })
      | undefined;

    console.error(`[email.service] Failed to send lead ${SEND_LABELS[index]} email`, {
      kind: reason instanceof EmailError ? reason.kind : undefined,
      message: reason instanceof Error ? reason.message : String(reason),
      code: nodemailerError?.code,
      responseCode: nodemailerError?.responseCode,
      command: nodemailerError?.command,
    });
  });
}

async function sendLeadNotificationEmail(lead: Lead): Promise<void> {
  const { emailFrom, leadNotificationEmail } = emailConfig;
  if (!emailFrom || !leadNotificationEmail) {
    throw new EmailError(
      "EMAIL_FROM or LEAD_NOTIFICATION_EMAIL is not configured.",
      "config",
    );
  }

  const transporter = getSmtpTransporter();
  const { subject, html, text, replyTo } = buildLeadNotificationEmail(lead);

  try {
    await transporter.sendMail({
      from: emailFrom,
      to: leadNotificationEmail,
      replyTo,
      subject,
      html,
      text,
    });
  } catch (error) {
    throw new EmailError(
      error instanceof Error ? error.message : "SMTP send failed",
      "smtp",
      { cause: error },
    );
  }
}

async function sendLeadConfirmationEmail(lead: Lead): Promise<void> {
  const { emailFrom } = emailConfig;
  if (!emailFrom) {
    throw new EmailError("EMAIL_FROM is not configured.", "config");
  }

  const transporter = getSmtpTransporter();
  const { subject, html, text } = buildLeadConfirmationEmail(lead);

  try {
    await transporter.sendMail({
      from: emailFrom,
      to: lead.email,
      subject,
      html,
      text,
    });
  } catch (error) {
    throw new EmailError(
      error instanceof Error ? error.message : "SMTP send failed",
      "smtp",
      { cause: error },
    );
  }
}
