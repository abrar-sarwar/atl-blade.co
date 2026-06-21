import { listCategories } from "@/lib/db/categories";
import { CategoryManager } from "./_components/category-manager";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await listCategories();
  return <CategoryManager categories={categories} />;
}
