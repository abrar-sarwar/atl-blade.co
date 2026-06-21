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

/**
 * Guard for admin-only surfaces (layout, pages, server actions).
 * - Not signed in  → redirect to sign-in.
 * - Signed in, not admin → redirect to the homepage (per spec).
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
  return user;
}
