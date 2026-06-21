import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getProduct } from "@/lib/db/products";
import { listCategories } from "@/lib/db/categories";
import { ProductForm } from "../../_components/product-form";
import { ImageManager } from "../../_components/image-manager";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProduct(id),
    listCategories(),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/products"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Back to products
      </Link>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">{product.name}</h2>
      </div>

      <ImageManager productId={product.id} images={product.images} />
      <ProductForm product={product} categories={categories} />
    </div>
  );
}
