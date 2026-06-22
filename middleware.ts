import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./lib/types/database";

/**
 * Refreshes the Supabase auth session on each request and applies a coarse
 * gate on /admin: unauthenticated users are redirected to the sign-in page.
 * Fine-grained role enforcement happens server-side in the admin layout and
 * in each Server Action / Route Handler (defense in depth).
 *
 * NOTE: This logic is intentionally inlined (rather than imported from
 * lib/supabase/*) and uses only real npm packages. The Node.js middleware
 * runtime does not resolve the "@/" TypeScript path alias at runtime, so a
 * "@/lib/..." import here throws ERR_MODULE_NOT_FOUND on Vercel.
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: getUser() revalidates the token with the auth server.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/signin";
    url.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
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
