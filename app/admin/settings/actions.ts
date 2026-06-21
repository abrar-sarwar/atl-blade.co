"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { siteSettingsInputSchema } from "@/lib/validation/settings";
import { updateSiteSettings } from "@/lib/db/settings";
import { ok, fail, describeDbError, type ActionResult } from "@/lib/actions/result";

export async function saveSettingsAction(raw: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = siteSettingsInputSchema.safeParse(raw);
  if (!parsed.success) {
    return fail("Please fix the highlighted fields.", {
      ...parsed.error.flatten().fieldErrors,
    });
  }

  try {
    await updateSiteSettings(parsed.data);
    revalidatePath("/admin/settings");
    revalidatePath("/");
    revalidatePath("/contact");
    return ok(undefined);
  } catch (err) {
    return fail(describeDbError(err));
  }
}
