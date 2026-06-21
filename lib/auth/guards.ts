import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRow } from "@/lib/types/db";

export type CurrentUser = {
  id: string;
  email: string;
  role: UserRow["role"];
  fullName: string | null;
  avatarUrl: string | null;
};

/**
 * Returns the current authenticated user with their app role, or null.
 * Reads the role from public.users (the source of truth for authorization).
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("role, full_name, avatar_url, email")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: profile?.email ?? user.email ?? "",
    role: profile?.role ?? "customer",
    fullName: profile?.full_name ?? null,
    avatarUrl: profile?.avatar_url ?? null,
  };
}

export type AssuranceLevel = "aal1" | "aal2" | null;

/**
 * The current and next Authenticator Assurance Levels for the session.
 * - currentLevel "aal2" → the user has completed 2FA this session.
 * - nextLevel "aal2" while current "aal1" → 2FA is enrolled but not yet verified.
 * - nextLevel "aal1" → no verified 2FA factor exists (must enroll).
 */
export async function getAssurance(): Promise<{
  currentLevel: AssuranceLevel;
  nextLevel: AssuranceLevel;
}> {
  const supabase = await createClient();
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  return {
    currentLevel: (data?.currentLevel ?? null) as AssuranceLevel,
    nextLevel: (data?.nextLevel ?? null) as AssuranceLevel,
  };
}

/**
 * Guard for admin-only surfaces (layout, pages, server actions).
 * - Not signed in  → redirect to sign-in.
 * - Signed in, not admin → redirect to the homepage (per spec).
 * - Admin without completed 2FA → redirect to enroll (no factor) or
 *   challenge (factor exists, needs a code). Enforces AAL2 on all admin access.
 * Returns the admin user when access is granted.
 */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }
  if (user.role !== "admin") {
    redirect("/");
  }

  const { currentLevel, nextLevel } = await getAssurance();
  if (currentLevel !== "aal2") {
    // nextLevel aal2 = a verified factor exists → just needs to enter a code.
    redirect(nextLevel === "aal2" ? "/auth/2fa" : "/auth/setup-2fa");
  }

  return user;
}
