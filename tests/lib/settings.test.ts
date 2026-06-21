import { describe, it, expect } from "vitest";
import {
  homepageSettingsInputSchema,
  siteSettingsInputSchema,
  bannerSchema,
  sectionSchema,
} from "@/lib/validation/settings";

describe("homepageSettingsInputSchema", () => {
  it("applies array defaults when omitted", () => {
    const parsed = homepageSettingsInputSchema.parse({});
    expect(parsed.hero_gallery).toEqual([]);
    expect(parsed.featured_product_ids).toEqual([]);
    expect(parsed.banners).toEqual([]);
    expect(parsed.sections).toEqual([]);
  });

  it("accepts a full homepage payload", () => {
    const result = homepageSettingsInputSchema.safeParse({
      hero_title: "Handmade **Knives**",
      hero_gallery: ["/a.png", "/b.png"],
      featured_product_ids: ["11111111-1111-4111-8111-111111111111"],
      banners: [{ text: "Sale", active: true }],
      sections: [{ type: "quote", body: "Nice", attribution: "— Z" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-uuid featured id", () => {
    const result = homepageSettingsInputSchema.safeParse({
      featured_product_ids: ["not-a-uuid"],
    });
    expect(result.success).toBe(false);
  });
});

describe("bannerSchema / sectionSchema", () => {
  it("requires banner text and defaults active true", () => {
    expect(bannerSchema.safeParse({ text: "" }).success).toBe(false);
    expect(bannerSchema.parse({ text: "Hi" }).active).toBe(true);
  });

  it("restricts section type to the known set", () => {
    expect(sectionSchema.safeParse({ type: "about" }).success).toBe(true);
    expect(sectionSchema.safeParse({ type: "carousel" }).success).toBe(false);
  });
});

describe("siteSettingsInputSchema", () => {
  it("rejects an invalid email but allows empty", () => {
    expect(
      siteSettingsInputSchema.safeParse({ contact_email: "nope" }).success,
    ).toBe(false);
    expect(
      siteSettingsInputSchema.safeParse({ contact_email: "" }).success,
    ).toBe(true);
  });

  it("defaults social_links to an object", () => {
    expect(siteSettingsInputSchema.parse({}).social_links).toEqual({});
  });
});
