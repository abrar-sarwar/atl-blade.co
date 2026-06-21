"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { slugify } from "@/lib/utils";
import type { ProductWithImages } from "@/lib/db/products";
import type { CategoryWithCount } from "@/lib/db/categories";
import { saveProductAction } from "../actions";

type Props = {
  product: ProductWithImages | null;
  categories: CategoryWithCount[];
};

const NO_CATEGORY = "__none__";

export function ProductForm({ product, categories }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(product));
  const [description, setDescription] = useState(product?.description ?? "");
  const [categoryId, setCategoryId] = useState(
    product?.category_id ?? NO_CATEGORY,
  );
  const [price, setPrice] = useState(product?.price?.toString() ?? "");
  const [salePrice, setSalePrice] = useState(
    product?.sale_price?.toString() ?? "",
  );
  const [inventory, setInventory] = useState(
    product?.inventory?.toString() ?? "0",
  );
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [active, setActive] = useState(product?.active ?? true);
  const [badge, setBadge] = useState(product?.badge ?? "");
  const [tags, setTags] = useState((product?.tags ?? []).join(", "));
  const [specs, setSpecs] = useState<[string, string][]>(
    (product?.specs as [string, string][]) ?? [],
  );
  const [features, setFeatures] = useState<string[]>(product?.features ?? []);

  function onNameChange(value: string) {
    setName(value);
    if (!slugEdited) setSlug(slugify(value));
  }

  function fieldError(key: string) {
    return errors[key]?.[0];
  }

  function submit() {
    const payload = {
      name,
      slug,
      description: description || null,
      category_id: categoryId === NO_CATEGORY ? null : categoryId,
      price: price === "" ? null : Number(price),
      sale_price: salePrice === "" ? null : Number(salePrice),
      inventory: inventory === "" ? 0 : Number(inventory),
      featured,
      active,
      badge: badge || null,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      specs: specs.filter(([l, v]) => l.trim() && v.trim()),
      features: features.map((f) => f.trim()).filter(Boolean),
    };

    startTransition(async () => {
      const res = await saveProductAction(product?.id ?? null, payload);
      if (res.ok) {
        toast.success(product ? "Product saved" : "Product created");
        setErrors({});
        if (!product) {
          router.push(`/admin/products/${res.data.id}/edit`);
        } else {
          router.refresh();
        }
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
      className="grid gap-6 lg:grid-cols-3"
    >
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Name" error={fieldError("name")}>
              <Input
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                required
              />
            </Field>
            <Field label="Slug" error={fieldError("slug")} hint="Used in the product URL.">
              <Input
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugEdited(true);
                }}
                required
              />
            </Field>
            <Field label="Description" error={fieldError("description")}>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Specifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {specs.map((row, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  placeholder="Label (e.g. Blade)"
                  value={row[0]}
                  onChange={(e) => {
                    const next = [...specs];
                    next[i] = [e.target.value, row[1]];
                    setSpecs(next);
                  }}
                />
                <Input
                  placeholder="Value (e.g. Damascus steel)"
                  value={row[1]}
                  onChange={(e) => {
                    const next = [...specs];
                    next[i] = [row[0], e.target.value];
                    setSpecs(next);
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSpecs(specs.filter((_, j) => j !== i))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSpecs([...specs, ["", ""]])}
            >
              <Plus className="size-4" /> Add spec
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {features.map((f, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={f}
                  onChange={(e) => {
                    const next = [...features];
                    next[i] = e.target.value;
                    setFeatures(next);
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setFeatures(features.filter((_, j) => j !== i))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFeatures([...features, ""])}
            >
              <Plus className="size-4" /> Add feature
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Organize</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Category">
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CATEGORY}>No category</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field
              label="Tags"
              hint="Comma-separated; power the storefront filters (e.g. damascus, pocket)."
            >
              <Input value={tags} onChange={(e) => setTags(e.target.value)} />
            </Field>
            <Field label="Badge" hint="Optional corner label (e.g. Limited).">
              <Input value={badge} onChange={(e) => setBadge(e.target.value)} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing & Stock</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Price (USD)" error={fieldError("price")}>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Leave blank for 'coming soon'"
              />
            </Field>
            <Field label="Sale price (USD)" error={fieldError("sale_price")}>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
              />
            </Field>
            <Field label="Inventory" error={fieldError("inventory")}>
              <Input
                type="number"
                min="0"
                value={inventory}
                onChange={(e) => setInventory(e.target.value)}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visibility</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="featured">Featured</Label>
              <Switch id="featured" checked={featured} onCheckedChange={setFeatured} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="active">Active (visible in store)</Label>
              <Switch id="active" checked={active} onCheckedChange={setActive} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={isPending} className="flex-1">
            {isPending ? "Saving…" : product ? "Save changes" : "Create product"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/products")}
          >
            Cancel
          </Button>
        </div>
        {!product ? (
          <p className="text-xs text-muted-foreground">
            Save the product first, then add images on the edit screen.
          </p>
        ) : null}
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && !error ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
