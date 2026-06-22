import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Run on the Node.js runtime (stable since Next.js 15.5). The Supabase SSR
  // client pulls in modules the Edge runtime rejects ("unsupported modules"),
  // which fails the Vercel build; Node.js avoids that bundling entirely.
  runtime: "nodejs",
  matcher: [
    /*
     * Run on all paths except static assets and image files so the session
     * stays fresh, while keeping the matcher cheap.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
