import { z } from "zod";

export const discountInputSchema = z
  .object({
    code: z
      .string()
      .min(2, "Code is required")
      .max(40)
      .regex(/^[A-Z0-9_-]+$/, "Code must be uppercase letters, numbers, - or _"),
    type: z.enum(["percentage", "fixed"]),
    value: z.coerce.number().positive("Value must be positive"),
    starts_at: z.string().datetime().nullable().optional(),
    expires_at: z.string().datetime().nullable().optional(),
    usage_limit: z.coerce.number().int().positive().nullable().optional(),
    min_subtotal: z.coerce.number().nonnegative().nullable().optional(),
    active: z.boolean().default(true),
  })
  .refine(
    (d) => d.type !== "percentage" || d.value <= 100,
    { message: "Percentage cannot exceed 100", path: ["value"] },
  )
  .refine(
    (d) =>
      !d.starts_at ||
      !d.expires_at ||
      new Date(d.starts_at) < new Date(d.expires_at),
    { message: "Expiry must be after the start date", path: ["expires_at"] },
  );

export type DiscountInput = z.infer<typeof discountInputSchema>;
