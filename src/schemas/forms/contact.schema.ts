import { z } from "zod";

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().optional(),
  company: z.string().trim().optional(),
  serviceInterest: z.string().trim().min(1, "Select a service"),
  budget: z.string().trim().min(1, "Select a budget range"),
  message: z.string().trim().min(10, "Message must be at least 10 characters"),
  consent: z.literal(true, "You must consent to be contacted"),
  // Honeypot (audit FORM-2) — hidden from real visitors in ContactForm.tsx,
  // so any value here means a bot. Deliberately permissive at the schema
  // level: rejecting it as a field error would tell a bot exactly which
  // input gave it away. The real check runs server-side in
  // contact.service.ts via isHoneypotFilled().
  website: z.string().optional(),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
