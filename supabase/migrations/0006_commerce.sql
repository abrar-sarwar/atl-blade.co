-- =============================================================================
-- Commerce: order-number generation + idempotent paid-order finalize.
-- =============================================================================

-- Human-friendly order numbers (ATL-1005, ATL-1006, …). Starts after the seed's
-- ATL-1001..1004 so app-created orders don't collide.
create sequence if not exists public.order_number_seq start with 1005;

create or replace function public.next_order_number()
returns text
language sql
volatile
as $$
  select 'ATL-' || lpad(nextval('public.order_number_seq')::text, 4, '0');
$$;

alter table public.orders
  alter column order_number set default public.next_order_number();

grant usage, select on sequence public.order_number_seq to service_role, authenticated;
grant execute on function public.next_order_number() to service_role, authenticated;

-- Finalize a paid order exactly once: mark paid + stripe ids, decrement
-- inventory, bump discount usage. Idempotent (no-ops if already paid).
create or replace function public.mark_order_paid(
  p_order_id uuid,
  p_payment_intent text,
  p_session text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_status public.payment_status;
begin
  select payment_status into current_status
  from public.orders
  where id = p_order_id
  for update;

  if current_status is null then
    raise exception 'Order % not found', p_order_id;
  end if;

  -- Already finalized — make redelivered webhooks a no-op.
  if current_status = 'paid' then
    return;
  end if;

  update public.orders
  set payment_status = 'paid',
      stripe_payment_intent_id = coalesce(p_payment_intent, stripe_payment_intent_id),
      stripe_checkout_session_id = coalesce(p_session, stripe_checkout_session_id)
  where id = p_order_id;

  -- Decrement inventory for each line, never below zero.
  update public.products p
  set inventory = greatest(0, p.inventory - oi.quantity)
  from public.order_items oi
  where oi.order_id = p_order_id and oi.product_id = p.id;

  -- Bump discount usage if one was applied.
  update public.discounts d
  set usage_count = usage_count + 1
  from public.orders o
  where o.id = p_order_id and o.discount_id = d.id;
end;
$$;

grant execute on function public.mark_order_paid(uuid, text, text) to service_role;
