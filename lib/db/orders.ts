import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Order,
  OrderItem,
  PaymentStatus,
  FulfillmentStatus,
  UpdateDto,
} from "@/lib/types/db";
import type { OrderTotals } from "@/lib/commerce/pricing";

export type OrderListItem = Order & { item_count: number };
export type OrderWithItems = Order & { items: OrderItem[] };

export type PendingOrderInput = {
  customer: { name: string; email: string; phone?: string | null };
  items: {
    productId: string;
    name: string;
    slug: string;
    unitPrice: number;
    quantity: number;
  }[];
  totals: OrderTotals;
  discountId: string | null;
};

/**
 * Creates a pending order + items using the service-role client (public
 * checkout — the buyer is not an admin, so this trusted server op bypasses RLS).
 * Returns the new order id and number.
 */
export async function createPendingOrder(
  input: PendingOrderInput,
): Promise<{ id: string; orderNumber: string }> {
  const supabase = createAdminClient();

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      customer_name: input.customer.name,
      customer_email: input.customer.email,
      customer_phone: input.customer.phone ?? null,
      subtotal: input.totals.subtotal,
      discount_total: input.totals.discountTotal,
      shipping_total: input.totals.shippingTotal,
      tax_total: input.totals.taxTotal,
      total: input.totals.total,
      discount_id: input.discountId,
      payment_status: "pending",
      fulfillment_status: "pending",
    })
    .select("id, order_number")
    .single();
  if (error) throw error;

  const items = input.items.map((i) => ({
    order_id: order.id,
    product_id: i.productId,
    product_name: i.name,
    product_slug: i.slug,
    unit_price: i.unitPrice,
    quantity: i.quantity,
    line_total: Math.round(i.unitPrice * i.quantity * 100) / 100,
  }));
  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(items);
  if (itemsError) throw itemsError;

  return { id: order.id, orderNumber: order.order_number };
}

export type StripeCustomerDetails = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  shippingAddress?: Record<string, unknown> | null;
};

/** Fills in real customer/shipping details captured by Stripe Checkout. */
export async function setOrderCustomerDetails(
  orderId: string,
  details: StripeCustomerDetails,
): Promise<void> {
  const supabase = createAdminClient();
  const patch: UpdateDto<"orders"> = {};
  if (details.name) patch.customer_name = details.name;
  if (details.email) patch.customer_email = details.email;
  if (details.phone) patch.customer_phone = details.phone;
  if (details.shippingAddress)
    patch.shipping_address = details.shippingAddress as UpdateDto<"orders">["shipping_address"];
  if (Object.keys(patch).length === 0) return;
  const { error } = await supabase.from("orders").update(patch).eq("id", orderId);
  if (error) throw error;
}

export async function attachCheckoutSession(
  orderId: string,
  sessionId: string,
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("orders")
    .update({ stripe_checkout_session_id: sessionId })
    .eq("id", orderId);
  if (error) throw error;
}

/**
 * Finalizes a paid order idempotently (sets paid, decrements inventory, bumps
 * discount usage) via the mark_order_paid SQL function. Service-role.
 */
export async function finalizePaidOrder(
  orderId: string,
  paymentIntentId: string | null,
  sessionId: string | null,
): Promise<void> {
  const supabase = createAdminClient();
  // The SQL function params are nullable text (coalesced internally); the
  // generated Args type marks them required, so cast to pass through nulls.
  const { error } = await supabase.rpc("mark_order_paid", {
    p_order_id: orderId,
    p_payment_intent: paymentIntentId as string,
    p_session: sessionId as string,
  });
  if (error) throw error;
}

// ---- Admin reads/writes (RLS: admin-only) ----------------------------------

export async function listOrders(filters?: {
  status?: FulfillmentStatus | "all";
  search?: string;
}): Promise<OrderListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("*, order_items(count)")
    .order("created_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("fulfillment_status", filters.status);
  }
  if (filters?.search) {
    const s = filters.search;
    query = query.or(`order_number.ilike.%${s}%,customer_email.ilike.%${s}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row) => {
    const { order_items, ...order } = row as Order & {
      order_items: { count: number }[];
    };
    return { ...(order as Order), item_count: order_items?.[0]?.count ?? 0 };
  });
}

export async function getOrder(id: string): Promise<OrderWithItems | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { order_items, ...order } = data;
  return { ...(order as Order), items: (order_items ?? []) as OrderItem[] };
}

export async function updateFulfillmentStatus(
  id: string,
  status: FulfillmentStatus,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ fulfillment_status: status })
    .eq("id", id);
  if (error) throw error;
}

export async function updatePaymentStatus(
  id: string,
  status: PaymentStatus,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ payment_status: status })
    .eq("id", id);
  if (error) throw error;
}
