"use client";

import { useRouter, useSearchParams } from "next/navigation";

const FILTERS = [
  { label: "All Blades", tag: "" },
  { label: "Damascus", tag: "damascus" },
  { label: "Pocket", tag: "pocket" },
  { label: "Outdoor", tag: "outdoor" },
  { label: "Tactical", tag: "tactical" },
];

export function FilterBar() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("filter") ?? "";

  function select(tag: string) {
    const next = new URLSearchParams(params.toString());
    if (tag) next.set("filter", tag);
    else next.delete("filter");
    router.replace(`/shop${next.toString() ? `?${next.toString()}` : ""}`);
  }

  return (
    <div className="shop-filters">
      {FILTERS.map((f) => (
        <button
          key={f.label}
          className={`filter-btn ${current === f.tag ? "active" : ""}`}
          onClick={() => select(f.tag)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
