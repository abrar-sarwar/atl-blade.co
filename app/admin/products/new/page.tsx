import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { listCategories } from "@/lib/db/categories";
import { ProductForm } from "../_components/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await listCategories();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/products"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Back to products
      </Link>
      <h2 className="text-2xl font-semibold tracking-tight">New Product</h2>
      <ProductForm product={null} categories={categories} />
    </div>
  );
}
