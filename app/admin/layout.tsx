import { requireAdmin } from "@/lib/auth/guards";
import { Sidebar } from "@/components/admin/sidebar";
import { Topbar } from "@/components/admin/topbar";

/**
 * Admin shell. `requireAdmin()` enforces authentication + admin role on the
 * server for every nested route; non-admins are redirected before any admin
 * UI renders. This is the primary route protection (middleware adds a coarse
 * unauthenticated gate; Server Actions/API re-check independently).
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          email={user.email}
          fullName={user.fullName}
          avatarUrl={user.avatarUrl}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
