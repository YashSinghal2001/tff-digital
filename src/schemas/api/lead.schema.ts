import { z } from "zod";

export const wpLeadResponseSchema = z.object({
  id: z.number(),
  status: z.enum(["success", "error"]),
  message: z.string().optional(),
});

export type WPLeadResponseParsed = z.infer<typeof wpLeadResponseSchema>;
