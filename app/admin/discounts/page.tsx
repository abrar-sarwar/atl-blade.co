import { listDiscounts } from "@/lib/db/discounts";
import { DiscountManager } from "./_components/discount-manager";

export const dynamic = "force-dynamic";

export default async function DiscountsPage() {
  const discounts = await listDiscounts();
  return <DiscountManager discounts={discounts} />;
}
