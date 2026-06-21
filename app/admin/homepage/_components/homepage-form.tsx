"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ChevronUp, ChevronDown, X } from "lucide-react";
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
import type { HomepageSettings } from "@/lib/types/db";
import type { Banner, HomeSection } from "@/lib/validation/settings";
import { saveHomepageAction } from "../actions";

type ProductOption = { id: string; name: string };

export function HomepageForm({
  settings,
  productOptions,
}: {
  settings: HomepageSettings | null;
  productOptions: ProductOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [heroEyebrow, setHeroEyebrow] = useState(settings?.hero_eyebrow ?? "");
  const [heroTitle, setHeroTitle] = useState(settings?.hero_title ?? "");
  const [heroSubtitle, setHeroSubtitle] = useState(settings?.hero_subtitle ?? "");
  const [heroImage, setHeroImage] = useState(settings?.hero_image_url ?? "");
  const [ctaText, setCtaText] = useState(settings?.hero_cta_text ?? "");
  const [ctaLink, setCtaLink] = useState(settings?.hero_cta_link ?? "");
  const [gallery, setGallery] = useState<string[]>(
    (settings?.hero_gallery as string[]) ?? [],
  );
  const [featured, setFeatured] = useState<string[]>(
    (settings?.featured_product_ids as string[]) ?? [],
  );
  const [banners, setBanners] = useState<Banner[]>(
    (settings?.banners as Banner[]) ?? [],
  );
  const [sections, setSections] = useState<HomeSection[]>(
    (settings?.sections as HomeSection[]) ?? [],
  );

  const nameFor = (id: string) =>
    productOptions.find((p) => p.id === id)?.name ?? id;
  const available = productOptions.filter((p) => !featured.includes(p.id));

  function moveFeatured(i: number, dir: number) {
    const j = i + dir;
    if (j < 0 || j >= featured.length) return;
    const next = [...featured];
    [next[i], next[j]] = [next[j], next[i]];
    setFeatured(next);
  }

  function submit() {
    const payload = {
      hero_eyebrow: heroEyebrow || null,
      hero_title: heroTitle || null,
      hero_subtitle: heroSubtitle || null,
      hero_image_url: heroImage || null,
      hero_cta_text: ctaText || null,
      hero_cta_link: ctaLink || null,
      hero_gallery: gallery.filter(Boolean),
      featured_product_ids: featured,
      banners: banners.filter((b) => b.text.trim()),
      sections: sections.filter((s) => s.type),
    };
    startTransition(async () => {
      const res = await saveHomepageAction(payload);
      if (res.ok) {
        toast.success("Homepage saved");
        router.refresh();
      } else {
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
      {/* Hero */}
      <Card>
        <CardHeader>
          <CardTitle>Hero</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Eyebrow</Label>
            <Input value={heroEyebrow} onChange={(e) => setHeroEyebrow(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Textarea
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              Wrap a word in **double asterisks** to render it gold/italic.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Subtitle</Label>
            <Textarea
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              rows={2}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>CTA text</Label>
              <Input value={ctaText} onChange={(e) => setCtaText(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>CTA link</Label>
              <Input value={ctaLink} onChange={(e) => setCtaLink(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Hero image URL (fallback)</Label>
            <Input value={heroImage} onChange={(e) => setHeroImage(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Hero gallery */}
      <Card>
        <CardHeader>
          <CardTitle>Hero Gallery</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {gallery.map((url, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={url}
                placeholder="/products/.../image.png"
                onChange={(e) => {
                  const next = [...gallery];
                  next[i] = e.target.value;
                  setGallery(next);
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setGallery(gallery.filter((_, j) => j !== i))}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setGallery([...gallery, ""])}
          >
            <Plus className="size-4" /> Add image
          </Button>
        </CardContent>
      </Card>

      {/* Featured products */}
      <Card>
        <CardHeader>
          <CardTitle>Featured Products</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {featured.length === 0 ? (
            <p className="text-sm text-muted-foreground">No featured products yet.</p>
          ) : (
            <ul className="space-y-2">
              {featured.map((id, i) => (
                <li
                  key={id}
                  className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <span className="truncate">
                    {i + 1}. {nameFor(id)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => moveFeatured(i, -1)}>
                      <ChevronUp className="size-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => moveFeatured(i, 1)}>
                      <ChevronDown className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive"
                      onClick={() => setFeatured(featured.filter((x) => x !== id))}
                    >
                      <X className="size-4" />
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {available.length > 0 ? (
            <Select onValueChange={(v) => setFeatured([...featured, v])} value="">
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue placeholder="Add a product…" />
              </SelectTrigger>
              <SelectContent>
                {available.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </CardContent>
      </Card>

      {/* Banners */}
      <Card>
        <CardHeader>
          <CardTitle>Promotional Banners</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {banners.map((b, i) => (
            <div key={i} className="space-y-2 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Banner {i + 1}
                </span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs">
                    <Switch
                      checked={b.active}
                      onCheckedChange={(v) => {
                        const next = [...banners];
                        next[i] = { ...b, active: v };
                        setBanners(next);
                      }}
                    />
                    Active
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive"
                    onClick={() => setBanners(banners.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              <Input
                placeholder="Banner text"
                value={b.text}
                onChange={(e) => {
                  const next = [...banners];
                  next[i] = { ...b, text: e.target.value };
                  setBanners(next);
                }}
              />
              <Input
                placeholder="Link (optional, e.g. /shop)"
                value={b.link ?? ""}
                onChange={(e) => {
                  const next = [...banners];
                  next[i] = { ...b, link: e.target.value };
                  setBanners(next);
                }}
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setBanners([...banners, { text: "", link: "", active: true }])
            }
          >
            <Plus className="size-4" /> Add banner
          </Button>
        </CardContent>
      </Card>

      {/* Sections */}
      <Card>
        <CardHeader>
          <CardTitle>Homepage Sections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sections.map((s, i) => (
            <div key={i} className="space-y-2 rounded-md border p-3">
              <div className="flex items-center justify-between gap-2">
                <Select
                  value={s.type}
                  onValueChange={(v) => {
                    const next = [...sections];
                    next[i] = { ...s, type: v as HomeSection["type"] };
                    setSections(next);
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="about">About (image + text)</SelectItem>
                    <SelectItem value="quote">Quote</SelectItem>
                    <SelectItem value="text">Text block</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1">
                  <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => {
                    if (i === 0) return;
                    const next = [...sections];
                    [next[i - 1], next[i]] = [next[i], next[i - 1]];
                    setSections(next);
                  }}>
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => {
                    if (i === sections.length - 1) return;
                    const next = [...sections];
                    [next[i + 1], next[i]] = [next[i], next[i + 1]];
                    setSections(next);
                  }}>
                    <ChevronDown className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive"
                    onClick={() => setSections(sections.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              {s.type !== "quote" ? (
                <>
                  <Input
                    placeholder="Eyebrow (e.g. Our Story)"
                    value={s.eyebrow ?? ""}
                    onChange={(e) => {
                      const next = [...sections];
                      next[i] = { ...s, eyebrow: e.target.value };
                      setSections(next);
                    }}
                  />
                  <Input
                    placeholder="Heading"
                    value={s.heading ?? ""}
                    onChange={(e) => {
                      const next = [...sections];
                      next[i] = { ...s, heading: e.target.value };
                      setSections(next);
                    }}
                  />
                </>
              ) : null}
              <Textarea
                placeholder={s.type === "quote" ? "Quote text" : "Body (blank line = new paragraph)"}
                value={s.body ?? ""}
                rows={s.type === "about" ? 5 : 3}
                onChange={(e) => {
                  const next = [...sections];
                  next[i] = { ...s, body: e.target.value };
                  setSections(next);
                }}
              />
              {s.type === "about" ? (
                <Input
                  placeholder="Image URL (e.g. /home/atlanta.jpg)"
                  value={s.image_url ?? ""}
                  onChange={(e) => {
                    const next = [...sections];
                    next[i] = { ...s, image_url: e.target.value };
                    setSections(next);
                  }}
                />
              ) : null}
              {s.type === "quote" ? (
                <Input
                  placeholder="Attribution (e.g. — Zian)"
                  value={s.attribution ?? ""}
                  onChange={(e) => {
                    const next = [...sections];
                    next[i] = { ...s, attribution: e.target.value };
                    setSections(next);
                  }}
                />
              ) : null}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setSections([...sections, { type: "text", body: "" }])
            }
          >
            <Plus className="size-4" /> Add section
          </Button>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-background/80 py-4 backdrop-blur">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save homepage"}
        </Button>
      </div>
    </form>
  );
}
