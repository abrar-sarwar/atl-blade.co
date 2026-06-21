"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { isDiscountLive } from "@/lib/commerce/discounts";
import { formatDate } from "@/lib/utils";
import type { Discount } from "@/lib/types/db";
import {
  saveDiscountAction,
  toggleDiscountActiveAction,
  deleteDiscountAction,
} from "../actions";

/** ISO string -> value for <input type="datetime-local"> (local time). */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}
/** datetime-local value -> ISO string (or null). */
function toIso(local: string): string | null {
  if (!local) return null;
  return new Date(local).toISOString();
}

export function DiscountManager({ discounts }: { discounts: Discount[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Discount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Discount | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const [code, setCode] = useState("");
  const [type, setType] = useState<"percentage" | "fixed">("percentage");
  const [value, setValue] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [minSubtotal, setMinSubtotal] = useState("");
  const [active, setActive] = useState(true);

  const now = Date.now();

  function openCreate() {
    setEditing(null);
    setCode("");
    setType("percentage");
    setValue("");
    setStartsAt("");
    setExpiresAt("");
    setUsageLimit("");
    setMinSubtotal("");
    setActive(true);
    setErrors({});
    setDialogOpen(true);
  }

  function openEdit(d: Discount) {
    setEditing(d);
    setCode(d.code);
    setType(d.type);
    setValue(String(d.value));
    setStartsAt(toLocalInput(d.starts_at));
    setExpiresAt(toLocalInput(d.expires_at));
    setUsageLimit(d.usage_limit != null ? String(d.usage_limit) : "");
    setMinSubtotal(d.min_subtotal != null ? String(d.min_subtotal) : "");
    setActive(d.active);
    setErrors({});
    setDialogOpen(true);
  }

  function save() {
    const payload = {
      code,
      type,
      value: value === "" ? 0 : Number(value),
      starts_at: toIso(startsAt),
      expires_at: toIso(expiresAt),
      usage_limit: usageLimit === "" ? null : Number(usageLimit),
      min_subtotal: minSubtotal === "" ? null : Number(minSubtotal),
      active,
    };
    startTransition(async () => {
      const res = await saveDiscountAction(editing?.id ?? null, payload);
      if (res.ok) {
        toast.success(editing ? "Discount saved" : "Discount created");
        setDialogOpen(false);
        router.refresh();
      } else {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error);
      }
    });
  }

  function toggleActive(d: Discount) {
    startTransition(async () => {
      const res = await toggleDiscountActiveAction(d.id, !d.active);
      if (res.ok) router.refresh();
      else toast.error(res.error);
    });
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const res = await deleteDiscountAction(deleteTarget.id);
      if (res.ok) {
        toast.success("Discount deleted");
        setDeleteTarget(null);
        router.refresh();
      } else toast.error(res.error);
    });
  }

  function err(key: string) {
    return errors[key]?.[0];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Discounts</h2>
          <p className="text-sm text-muted-foreground">
            {discounts.length} {discounts.length === 1 ? "code" : "codes"}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" /> Add discount
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Value</TableHead>
              <TableHead className="text-right">Usage</TableHead>
              <TableHead>Window</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[120px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {discounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                  No discounts yet.
                </TableCell>
              </TableRow>
            ) : (
              discounts.map((d) => {
                const live = isDiscountLive(d, now);
                return (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono font-medium">{d.code}</TableCell>
                    <TableCell>
                      {d.type === "percentage"
                        ? `${Number(d.value)}%`
                        : `$${Number(d.value).toFixed(2)}`}
                      {d.min_subtotal != null ? (
                        <span className="ml-1 text-xs text-muted-foreground">
                          (min ${Number(d.min_subtotal).toFixed(0)})
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">
                      {d.usage_count}
                      {d.usage_limit != null ? ` / ${d.usage_limit}` : ""}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {d.starts_at ? formatDate(d.starts_at) : "—"} →{" "}
                      {d.expires_at ? formatDate(d.expires_at) : "∞"}
                    </TableCell>
                    <TableCell>
                      {live ? (
                        <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          Live
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-slate-500/15 text-slate-500">
                          {d.active ? "Inactive window" : "Off"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Switch
                          checked={d.active}
                          onCheckedChange={() => toggleActive(d)}
                          aria-label="Toggle active"
                        />
                        <Button variant="ghost" size="icon" onClick={() => openEdit(d)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => setDeleteTarget(d)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit discount" : "New discount"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Code</Label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="WELCOME10"
                  required
                />
                {err("code") ? <p className="text-xs text-destructive">{err("code")}</p> : null}
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as "percentage" | "fixed")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{type === "percentage" ? "Percent off" : "Amount off ($)"}</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                />
                {err("value") ? <p className="text-xs text-destructive">{err("value")}</p> : null}
              </div>
              <div className="space-y-1.5">
                <Label>Min subtotal ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={minSubtotal}
                  onChange={(e) => setMinSubtotal(e.target.value)}
                  placeholder="optional"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Starts</Label>
                <Input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Expires</Label>
                <Input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
                {err("expires_at") ? <p className="text-xs text-destructive">{err("expires_at")}</p> : null}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1.5 flex-1 mr-4">
                <Label>Usage limit</Label>
                <Input
                  type="number"
                  min="1"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  placeholder="unlimited"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={active} onCheckedChange={setActive} id="disc-active" />
                <Label htmlFor="disc-active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving…" : editing ? "Save" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleteTarget?.code}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the code. Past orders that used it keep their recorded
              totals.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
