"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

export default function TwoFactorChallengePage() {
  const router = useRouter();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/signin");
        return;
      }
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const verified = (factors?.totp ?? []).find((f) => f.status === "verified");
      if (!verified) {
        // No verified factor → enroll instead.
        router.push("/auth/setup-2fa");
        return;
      }
      setFactorId(verified.id);
    })();
  }, [router]);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setVerifying(true);
    setError(null);
    const supabase = createClient();

    const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({
      factorId,
    });
    if (cErr || !challenge) {
      setError(cErr?.message ?? "Could not verify the code.");
      setVerifying(false);
      return;
    }
    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: code.trim(),
    });
    if (vErr) {
      setError(vErr.message);
      setVerifying(false);
      return;
    }
    toast.success("Verified");
    router.push("/admin");
    router.refresh();
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/signin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">
            Two-Factor Authentication
          </p>
          <CardTitle className="mt-2 text-2xl">Enter your code</CardTitle>
          <CardDescription>
            Open your authenticator app and enter the current 6-digit code.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <p className="text-center text-sm text-destructive">{error}</p>
          ) : null}
          <form onSubmit={verify} className="space-y-3">
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="text-center text-lg tracking-[0.4em]"
              required
              autoFocus
            />
            <Button
              type="submit"
              className="w-full"
              disabled={verifying || !factorId || code.length !== 6}
            >
              {verifying ? "Verifying…" : "Verify"}
            </Button>
          </form>
          <button
            onClick={signOut}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Sign in with a different account
          </button>
        </CardContent>
      </Card>
    </main>
  );
}
