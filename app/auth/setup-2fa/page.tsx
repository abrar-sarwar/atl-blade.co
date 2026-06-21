"use client";

import { useEffect, useRef, useState } from "react";
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

export default function SetupTwoFactorPage() {
  const router = useRouter();
  const started = useRef(false);

  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/signin");
        return;
      }

      // If a verified factor already exists, go straight to the challenge.
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const verified = (factors?.totp ?? []).find((f) => f.status === "verified");
      if (verified) {
        router.push("/auth/2fa");
        return;
      }
      // Clear any stale unverified factors so we don't accumulate them.
      for (const f of factors?.all ?? []) {
        if (f.status === "unverified") {
          await supabase.auth.mfa.unenroll({ factorId: f.id });
        }
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Authenticator",
      });
      if (error || !data) {
        setError(error?.message ?? "Could not start 2FA setup.");
        return;
      }
      setFactorId(data.id);
      setQr(data.totp.qr_code);
      setSecret(data.totp.secret);
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
    toast.success("Two-factor authentication enabled");
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">
            Secure Your Account
          </p>
          <CardTitle className="mt-2 text-2xl">Set up 2FA</CardTitle>
          <CardDescription>
            Scan the QR code with Google Authenticator, Authy, or 1Password, then
            enter the 6-digit code.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <p className="text-center text-sm text-destructive">{error}</p>
          ) : null}

          {qr ? (
            <div className="flex flex-col items-center gap-3">
              {/* qr is an SVG data URL returned by Supabase — render directly */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qr}
                alt="2FA QR code"
                width={180}
                height={180}
                className="rounded bg-white p-2"
              />
              {secret ? (
                <p className="break-all text-center text-xs text-muted-foreground">
                  Can&apos;t scan? Enter this key manually:
                  <br />
                  <span className="font-mono">{secret}</span>
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              Preparing your authenticator…
            </p>
          )}

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
            />
            <Button
              type="submit"
              className="w-full"
              disabled={verifying || !factorId || code.length !== 6}
            >
              {verifying ? "Verifying…" : "Verify & continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
