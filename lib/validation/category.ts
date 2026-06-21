import { z } from "zod";

export const categoryInputSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, hyphenated"),
  description: z.string().max(2000).nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  sort_order: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;
