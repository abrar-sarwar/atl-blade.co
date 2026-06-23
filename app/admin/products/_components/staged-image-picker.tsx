"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Image picker for the *new* product form. Images attach to a product that
 * doesn't exist yet, so files are staged client-side and uploaded by the form
 * right after the product is created. The first staged file becomes primary
 * (matching addImage's first-image-is-primary rule). For existing products,
 * use ImageManager (which uploads immediately) instead.
 */
export function StagedImagePicker({
  files,
  onChange,
  disabled,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  // Derive object URLs for previews; revoke them when files change / unmount.
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  function addFiles(list: FileList | null) {
    if (list && list.length > 0) onChange([...files, ...Array.from(list)]);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Images</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="size-4" /> Add images
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif"
          multiple
          hidden
          onChange={(e) => addFiles(e.target.files)}
        />
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Add photos now — the first becomes the primary image. PNG, JPEG,
            WebP, or AVIF (max 10 MB). They upload when you create the product.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {files.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className={cn(
                  "group relative aspect-square overflow-hidden rounded-md border bg-muted",
                  i === 0 && "ring-2 ring-primary",
                )}
              >
                {previews[i] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previews[i]}
                    alt={file.name}
                    className="absolute inset-0 size-full object-cover"
                  />
                ) : null}
                {i === 0 ? (
                  <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                    Primary
                  </span>
                ) : null}
                <div className="absolute inset-x-0 bottom-0 flex justify-end bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-white hover:text-destructive"
                    title="Remove"
                    disabled={disabled}
                    onClick={() => onChange(files.filter((_, j) => j !== i))}
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
