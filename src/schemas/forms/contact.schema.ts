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
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
