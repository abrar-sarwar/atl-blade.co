"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useTransition, useState, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategoryWithCount } from "@/lib/db/categories";

type Props = {
  categories: CategoryWithCount[];
};

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
  { value: "featured", label: "Featured" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
  { value: "price_desc", label: "Price high–low" },
  { value: "price_asc", label: "Price low–high" },
  { value: "inventory_asc", label: "Inventory low–high" },
];

export function ProductsToolbar({ categories }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(params.get("search") ?? "");

  // Keep the local input in sync if the URL changes externally.
  useEffect(() => {
    setSearch(params.get("search") ?? "");
  }, [params]);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value && value !== "all") next.set(key, value);
    else next.delete(key);
    startTransition(() => router.replace(`${pathname}?${next.toString()}`));
  }

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setParam("search", search.trim());
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <form onSubmit={onSearchSubmit} className="relative max-w-xs flex-1">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…"
          className="pl-8"
          aria-label="Search products"
        />
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={params.get("category") ?? "all"}
          onValueChange={(v) => setParam("category", v)}
        >
          <SelectTrigger className="w-[160px]" aria-label="Filter by category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={params.get("status") ?? "all"}
          onValueChange={(v) => setParam("status", v)}
        >
          <SelectTrigger className="w-[140px]" aria-label="Filter by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={params.get("sort") ?? "newest"}
          onValueChange={(v) => setParam("sort", v)}
        >
          <SelectTrigger className="w-[160px]" aria-label="Sort products">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button asChild className={isPending ? "opacity-70" : ""}>
          <Link href="/admin/products/new">
            <Plus className="size-4" /> Add product
          </Link>
        </Button>
      </div>
    </div>
  );
}
