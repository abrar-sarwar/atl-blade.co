/** Standard result shape returned by Server Actions to client forms. */
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(
  error: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

/** Maps common Postgres/Supabase errors to friendly messages. */
export function describeDbError(err: unknown): string {
  const e = err as { code?: string; message?: string };
  if (e?.code === "23505") return "That slug or code is already in use.";
  if (e?.code === "23503") return "Related record not found.";
  return e?.message ?? "Something went wrong.";
}
