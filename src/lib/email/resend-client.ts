import "server-only";
import { Resend } from "resend";
import { emailConfig } from "@/config/email.config";
import { EmailError } from "@/lib/email/errors";

let cachedClient: Resend | null = null;

export function getResendClient(): Resend {
  if (!emailConfig.resendApiKey) {
    throw new EmailError(
      "RESEND_API_KEY is not configured. Set it in your environment.",
      "config",
    );
  }

  if (!cachedClient) {
    cachedClient = new Resend(emailConfig.resendApiKey);
  }

  return cachedClient;
}
