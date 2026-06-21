import Image from "next/image";
import Link from "next/link";
import {
  listProducts,
  type ProductFilters,
  type ProductSort,
  type ProductStatusFilter,
} from "@/lib/db/products";
import { listCategories } from "@/lib/db/categories";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { ProductsToolbar } from "./_components/products-toolbar";
import { ProductRowActions } from "./_components/product-row-actions";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const filters: ProductFilters = {
    search: sp.search,
    categoryId: sp.category,
    status: (sp.status as ProductStatusFilter) ?? "all",
    sort: (sp.sort as ProductSort) ?? "newest",
  };

  const [products, categories] = await Promise.all([
    listProducts(filters),
    listCategories(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Products</h2>
          <p className="text-sm text-muted-foreground">
            {products.length} {products.length === 1 ? "product" : "products"}
          </p>
        </div>
      </div>

      <ProductsToolbar categories={categories} />

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[64px]">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Inventory</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[48px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  No products match your filters.{" "}
                  <Link href="/admin/products/new" className="text-primary">
                    Add one
                  </Link>
                  .
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="relative size-10 overflow-hidden rounded bg-muted">
                      {p.primary_image ? (
                        <Image
                          src={p.primary_image}
                          alt={p.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="hover:text-primary"
                    >
                      {p.name}
                    </Link>
                    {p.featured ? (
                      <Badge variant="outline" className="ml-2 text-primary">
                        Featured
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.category?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {p.sale_price != null ? (
                      <span>
                        <span className="text-muted-foreground line-through">
                          {formatCurrency(Number(p.price))}
                        </span>{" "}
                        {formatCurrency(Number(p.sale_price))}
                      </span>
                    ) : (
                      formatCurrency(p.price != null ? Number(p.price) : null)
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        p.inventory === 0
                          ? "text-red-500"
                          : p.inventory < 5
                            ? "text-amber-500"
                            : ""
                      }
                    >
                      {p.inventory}
                    </span>
                  </TableCell>
                  <TableCell>
                    {p.active ? (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      >
                        Active
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-slate-500/15 text-slate-500"
                      >
                        Archived
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <ProductRowActions
                      id={p.id}
                      name={p.name}
                      archived={!p.active}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
