import "server-only";
import { NextResponse } from "next/server";
import { getCurrentUser, getAssurance, type CurrentUser } from "@/lib/auth/guards";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Guard for admin API route handlers. Returns the admin user, or a NextResponse
 * (401/403) to return immediately. Usage:
 *
 *   const auth = await requireAdminApi();
 *   if (auth instanceof NextResponse) return auth;
 *   // auth is the admin CurrentUser
 */
export async function requireAdminApi(): Promise<CurrentUser | NextResponse> {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (user.role !== "admin") return jsonError("Forbidden", 403);
  // Require completed 2FA (AAL2) for admin API access.
  const { currentLevel } = await getAssurance();
  if (currentLevel !== "aal2") return jsonError("Two-factor authentication required", 403);
  return user;
}
