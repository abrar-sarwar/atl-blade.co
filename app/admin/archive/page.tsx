import Image from "next/image";
import Link from "next/link";
import { Archive } from "lucide-react";
import { listProducts, type ProductFilters } from "@/lib/db/products";
import { formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { ProductRowActions } from "../products/_components/product-row-actions";

export const dynamic = "force-dynamic";

/**
 * Archive: products hidden from the storefront (active = false). Separate from
 * the main Products list so archived inventory can be reviewed and restored
 * without filtering. Restore lives in the per-row actions menu.
 */
export default async function ArchivePage() {
  const filters: ProductFilters = { status: "archived", sort: "newest" };
  const products = await listProducts(filters);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Archive</h2>
        <p className="text-sm text-muted-foreground">
          {products.length} archived{" "}
          {products.length === 1 ? "product" : "products"} — hidden from the
          storefront. Use the row menu to restore or edit.
        </p>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[64px]">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Inventory</TableHead>
              <TableHead className="w-[48px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  <Archive className="mx-auto mb-2 size-6 opacity-50" />
                  No archived products. Archived items appear here and stay
                  hidden from the store until restored.
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
                  <TableCell className="text-right">{p.inventory}</TableCell>
                  <TableCell>
                    <ProductRowActions id={p.id} name={p.name} archived={true} />
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
