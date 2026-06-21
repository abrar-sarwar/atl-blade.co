"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

function SignInCard() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get("redirectedFrom") ?? "/admin";

  async function signInWithGoogle() {
    setLoading(true);
    const supabase = createClient();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(
          redirectedFrom,
        )}`,
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  }

  return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">
            ATL Blade Co.
          </p>
          <CardTitle className="mt-2 text-2xl">Admin Sign In</CardTitle>
          <CardDescription>
            Authorized staff only. Sign in with your Google account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={signInWithGoogle}
            disabled={loading}
          >
            {loading ? "Redirecting…" : "Continue with Google"}
          </Button>
        </CardContent>
      </Card>
  );
}

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <Suspense fallback={null}>
        <SignInCard />
      </Suspense>
    </main>
  );
}
