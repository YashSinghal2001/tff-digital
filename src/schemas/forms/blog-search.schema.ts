import { z } from "zod";

export const blogSearchSchema = z.object({
  q: z.string().trim().min(1).optional(),
});

export type BlogSearchValues = z.infer<typeof blogSearchSchema>;

export const blogSearchParamsSchema = z.object({
  q: z.string().trim().min(1).optional().catch(undefined),
  after: z.string().trim().min(1).optional().catch(undefined),
});

export type BlogSearchParams = z.infer<typeof blogSearchParamsSchema>;
