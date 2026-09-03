import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { emailConfig } from "@/config/email.config";
import { EmailError } from "@/lib/email/errors";

let cachedTransporter: Transporter | null = null;

function buildTransporter(): Transporter {
  const { smtpHost, smtpPort, smtpSecure, smtpUser, smtpPassword } = emailConfig;

  if (!smtpHost || !smtpUser || !smtpPassword) {
    throw new EmailError(
      "SMTP_HOST, SMTP_USER, or SMTP_PASSWORD is not configured. Set them in your environment.",
      "config",
    );
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });
}

export function getSmtpTransporter(): Transporter {
  if (!cachedTransporter) {
    cachedTransporter = buildTransporter();
  }

  return cachedTransporter;
}

/**
 * Verifies SMTP connectivity and authentication without sending a message —
 * safe to call from development or an integration test. Delegates to
 * nodemailer's own `transporter.verify()`, which opens a connection,
 * authenticates, then closes it again.
 */
export async function verifySmtpConnection(): Promise<void> {
  const transporter = getSmtpTransporter();
  await transporter.verify();
}
