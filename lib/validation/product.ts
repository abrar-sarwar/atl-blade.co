import { z } from "zod";

/** A [label, value] spec pair as stored in products.specs. */
export const specPairSchema = z.tuple([z.string().min(1), z.string().min(1)]);

export const productInputSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, hyphenated"),
  description: z.string().max(5000).nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  price: z.coerce.number().nonnegative().nullable().optional(),
  sale_price: z.coerce.number().nonnegative().nullable().optional(),
  inventory: z.coerce.number().int().nonnegative().default(0),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  tags: z.array(z.string().min(1)).default([]),
  badge: z.string().max(40).nullable().optional(),
  specs: z.array(specPairSchema).default([]),
  features: z.array(z.string().min(1)).default([]),
})
  .refine(
    (p) =>
      p.sale_price == null ||
      p.price == null ||
      p.sale_price <= p.price,
    { message: "Sale price cannot exceed price", path: ["sale_price"] },
  );

export type ProductInput = z.infer<typeof productInputSchema>;
