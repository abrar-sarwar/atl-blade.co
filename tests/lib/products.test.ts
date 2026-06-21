import { describe, it, expect } from "vitest";
import { resolveSort } from "@/lib/db/products";

describe("resolveSort", () => {
  it("defaults to newest first", () => {
    expect(resolveSort()).toEqual({ column: "created_at", ascending: false });
    expect(resolveSort("newest")).toEqual({
      column: "created_at",
      ascending: false,
    });
  });

  it("maps name and price sorts to the right column + direction", () => {
    expect(resolveSort("name_asc")).toEqual({ column: "name", ascending: true });
    expect(resolveSort("name_desc")).toEqual({
      column: "name",
      ascending: false,
    });
    expect(resolveSort("price_asc")).toEqual({
      column: "price",
      ascending: true,
    });
    expect(resolveSort("price_desc")).toEqual({
      column: "price",
      ascending: false,
    });
  });

  it("maps inventory and oldest", () => {
    expect(resolveSort("inventory_asc")).toEqual({
      column: "inventory",
      ascending: true,
    });
    expect(resolveSort("oldest")).toEqual({
      column: "created_at",
      ascending: true,
    });
  });
});
