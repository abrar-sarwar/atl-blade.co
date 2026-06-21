"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SiteSettings } from "@/lib/types/db";
import { saveSettingsAction } from "../actions";

type Address = {
  line1?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
};

const SOCIAL_KEYS = ["instagram", "tiktok", "facebook", "x", "youtube"] as const;

export function SettingsForm({ settings }: { settings: SiteSettings | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const addr = (settings?.address as Address) ?? {};
  const social = (settings?.social_links as Record<string, string>) ?? {};

  const [companyName, setCompanyName] = useState(settings?.company_name ?? "");
  const [email, setEmail] = useState(settings?.contact_email ?? "");
  const [phone, setPhone] = useState(settings?.phone ?? "");
  const [address, setAddress] = useState<Address>(addr);
  const [shipping, setShipping] = useState(settings?.shipping_policy ?? "");
  const [returns, setReturns] = useState(settings?.return_policy ?? "");
  const [socials, setSocials] = useState<Record<string, string>>(social);

  function submit() {
    const payload = {
      company_name: companyName || null,
      contact_email: email || null,
      phone: phone || null,
      address,
      shipping_policy: shipping || null,
      return_policy: returns || null,
      social_links: Object.fromEntries(
        Object.entries(socials).filter(([, v]) => v && v.trim()),
      ),
    };
    startTransition(async () => {
      const res = await saveSettingsAction(payload);
      if (res.ok) {
        toast.success("Settings saved");
        setErrors({});
        router.refresh();
      } else {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error);
      }
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>Company</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Company name</Label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Contact email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.contact_email?.[0] ? (
                <p className="text-xs text-destructive">{errors.contact_email[0]}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Street</Label>
            <Input
              value={address.line1 ?? ""}
              onChange={(e) => setAddress({ ...address, line1: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>City</Label>
            <Input
              value={address.city ?? ""}
              onChange={(e) => setAddress({ ...address, city: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>State</Label>
            <Input
              value={address.state ?? ""}
              onChange={(e) => setAddress({ ...address, state: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Postal code</Label>
            <Input
              value={address.postal_code ?? ""}
              onChange={(e) =>
                setAddress({ ...address, postal_code: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Country</Label>
            <Input
              value={address.country ?? ""}
              onChange={(e) => setAddress({ ...address, country: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Policies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Shipping policy</Label>
            <Textarea
              rows={3}
              value={shipping}
              onChange={(e) => setShipping(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Return policy</Label>
            <Textarea
              rows={3}
              value={returns}
              onChange={(e) => setReturns(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social Links</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {SOCIAL_KEYS.map((key) => (
            <div key={key} className="space-y-1.5">
              <Label className="capitalize">{key}</Label>
              <Input
                placeholder="https://…"
                value={socials[key] ?? ""}
                onChange={(e) => setSocials({ ...socials, [key]: e.target.value })}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="sticky bottom-0 flex justify-end border-t bg-background/80 py-4 backdrop-blur">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </form>
  );
}
