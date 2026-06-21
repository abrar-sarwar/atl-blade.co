"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { homepageSettingsInputSchema } from "@/lib/validation/settings";
import { updateHomepageSettings } from "@/lib/db/settings";
import { ok, fail, describeDbError, type ActionResult } from "@/lib/actions/result";

export async function saveHomepageAction(
  raw: unknown,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = homepageSettingsInputSchema.safeParse(raw);
  if (!parsed.success) {
    return fail("Please fix the highlighted fields.", {
      ...parsed.error.flatten().fieldErrors,
    });
  }

  try {
    await updateHomepageSettings(parsed.data);
    revalidatePath("/admin/homepage");
    revalidatePath("/");
    return ok(undefined);
  } catch (err) {
    return fail(describeDbError(err));
  }
}
