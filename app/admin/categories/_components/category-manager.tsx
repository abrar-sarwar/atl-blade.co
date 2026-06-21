"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { slugify } from "@/lib/utils";
import type { CategoryWithCount } from "@/lib/db/categories";
import { saveCategoryAction, deleteCategoryAction } from "../actions";

type Editing = CategoryWithCount | null;

export function CategoryManager({
  categories,
}: {
  categories: CategoryWithCount[];
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Editing>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryWithCount | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  // form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [active, setActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  function openCreate() {
    setEditing(null);
    setName("");
    setSlug("");
    setSlugEdited(false);
    setDescription("");
    setSortOrder("0");
    setActive(true);
    setErrors({});
    setDialogOpen(true);
  }

  function openEdit(c: CategoryWithCount) {
    setEditing(c);
    setName(c.name);
    setSlug(c.slug);
    setSlugEdited(true);
    setDescription(c.description ?? "");
    setSortOrder(String(c.sort_order));
    setActive(c.active);
    setErrors({});
    setDialogOpen(true);
  }

  function save() {
    const payload = {
      name,
      slug,
      description: description || null,
      sort_order: sortOrder === "" ? 0 : Number(sortOrder),
      active,
    };
    startTransition(async () => {
      const res = await saveCategoryAction(editing?.id ?? null, payload);
      if (res.ok) {
        toast.success(editing ? "Category saved" : "Category created");
        setDialogOpen(false);
        router.refresh();
      } else {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error);
      }
    });
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const res = await deleteCategoryAction(deleteTarget.id);
      if (res.ok) {
        toast.success("Category deleted");
        setDeleteTarget(null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Categories</h2>
          <p className="text-sm text-muted-foreground">
            {categories.length} {categories.length === 1 ? "category" : "categories"}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" /> Add category
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-right">Products</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[96px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                  No categories yet.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.slug}</TableCell>
                  <TableCell className="text-right">{c.product_count}</TableCell>
                  <TableCell>
                    {c.active ? (
                      <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-slate-500/15 text-slate-500">
                        Hidden
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                        <Pencil className="size-4" />
                        <span className="sr-only">Edit {c.name}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => setDeleteTarget(c)}
                      >
                        <Trash2 className="size-4" />
                        <span className="sr-only">Delete {c.name}</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit category" : "New category"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slugEdited) setSlug(slugify(e.target.value));
                }}
                required
              />
              {errors.name?.[0] ? (
                <p className="text-xs text-destructive">{errors.name[0]}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugEdited(true);
                }}
                required
              />
              {errors.slug?.[0] ? (
                <p className="text-xs text-destructive">{errors.slug[0]}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-1.5">
                <Label>Sort order</Label>
                <Input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={active} onCheckedChange={setActive} id="cat-active" />
                <Label htmlFor="cat-active">Active</Label>
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

      {/* Delete confirm */}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleteTarget?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && deleteTarget.product_count > 0
                ? `${deleteTarget.product_count} product(s) will be left without a category (not deleted).`
                : "This category will be removed."}
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
