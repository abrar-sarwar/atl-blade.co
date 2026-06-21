"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Star, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ProductImageRow } from "@/lib/db/products";
import {
  uploadProductImageAction,
  deleteProductImageAction,
  setPrimaryImageAction,
} from "../actions";

export function ImageManager({
  productId,
  images,
}: {
  productId: string;
  images: ProductImageRow[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.set("file", file);
        const res = await uploadProductImageAction(productId, fd);
        if (!res.ok) toast.error(`${file.name}: ${res.error}`);
      }
      toast.success("Images uploaded");
      router.refresh();
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function makePrimary(imageId: string) {
    startTransition(async () => {
      const res = await setPrimaryImageAction(productId, imageId);
      if (res.ok) router.refresh();
      else toast.error(res.error);
    });
  }

  function remove(imageId: string) {
    startTransition(async () => {
      const res = await deleteProductImageAction(imageId);
      if (res.ok) {
        toast.success("Image removed");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Images</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="size-4" /> {uploading ? "Uploading…" : "Upload"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif"
          multiple
          hidden
          onChange={(e) => onFiles(e.target.files)}
        />
      </CardHeader>
      <CardContent>
        {images.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No images yet. Upload PNG, JPEG, WebP, or AVIF (max 10 MB).
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((img) => (
              <div
                key={img.id}
                className={cn(
                  "group relative aspect-square overflow-hidden rounded-md border bg-muted",
                  img.is_primary && "ring-2 ring-primary",
                )}
              >
                <Image
                  src={img.url}
                  alt={img.alt ?? ""}
                  fill
                  sizes="(max-width: 640px) 50vw, 200px"
                  className="object-cover"
                />
                {img.is_primary ? (
                  <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                    Primary
                  </span>
                ) : null}
                <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-white hover:text-primary"
                    title="Set as primary"
                    disabled={isPending || img.is_primary}
                    onClick={() => makePrimary(img.id)}
                  >
                    <Star className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-white hover:text-destructive"
                    title="Delete image"
                    disabled={isPending}
                    onClick={() => remove(img.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
