import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Phase 1 placeholder home page.
 *
 * The live customer-facing storefront is still the static site in `/legacy`
 * (run with `npm run legacy`). The pixel-faithful Next.js port of the
 * storefront lands in Phases 2–3. This page only exists so the app has a
 * root route and a link into the admin dashboard.
 */
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-primary">
          ATL Blade Co.
        </p>
        <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
          Storefront + Admin Platform
        </h1>
        <p className="max-w-md text-muted-foreground">
          The storefront is being migrated to Next.js. The admin dashboard is
          live for authorized staff.
        </p>
      </div>
      <Button asChild>
        <Link href="/admin">Go to Admin Dashboard</Link>
      </Button>
    </main>
  );
}
