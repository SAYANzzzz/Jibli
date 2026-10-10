-- Apply once in the Jibli Supabase SQL editor before using the payment flow.
create table if not exists public.d17_orders (
  id uuid primary key,
  user_id uuid not null references auth.users(id),
  order_id uuid unique references public.orders(id),
  product_key text not null,
  title text not null,
  kind text not null,
  amount numeric(12,3) not null check (amount > 0),
  details text not null default '',
  phone text not null,
  "authorization" text unique check ("authorization" ~ '^[0-9]{1,30}$'),
  status text not null default 'pending_payment' check (status in ('pending_payment','pending_verification','confirmed','processing','delivered','rejected')),
  review_note text not null default '',
  delivery text not null default '',
  reviewed_by uuid references auth.users(id),
  submitted_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists d17_orders_user_created on public.d17_orders(user_id, created_at desc);
alter table public.d17_orders enable row level security;
-- Browser clients never mutate payments directly; authenticated FastAPI endpoints
-- authorize ownership/admin role before using the server-only service key.
revoke all on public.d17_orders from anon, authenticated;
grant all on public.d17_orders to service_role;

create or replace function public.review_d17_order(payment_id uuid, expected_status text, changes jsonb)
returns setof public.d17_orders language plpgsql security invoker set search_path = '' as $$
declare p public.d17_orders;
begin
  update public.d17_orders set
    status = changes->>'status', review_note = changes->>'review_note',
    reviewed_by = (changes->>'reviewed_by')::uuid,
    updated_at = (changes->>'updated_at')::timestamptz,
    confirmed_at = coalesce((changes->>'confirmed_at')::timestamptz, confirmed_at),
    delivery = coalesce(changes->>'delivery', delivery)
  where id = payment_id and status = expected_status returning * into p;
  if not found then return; end if;
  if p.order_id is not null and p.status in ('confirmed','processing','delivered') then
    update public.orders set status = case p.status when 'confirmed' then 'deposit_paid' when 'processing' then 'ordered' else 'delivered' end,
      deposit_amount = p.amount where id = p.order_id;
    insert into public.order_events(order_id,user_id,status,note)
      values(p.order_id,p.user_id,case p.status when 'confirmed' then 'deposit_paid' when 'processing' then 'ordered' else 'delivered' end,
      case p.status when 'confirmed' then 'D17 payment verified by Jibli. Order confirmed.' when 'processing' then 'Jibli is processing your order.' else p.delivery end);
  end if;
  return next p;
end; $$;
revoke all on function public.review_d17_order(uuid,text,jsonb) from public, anon, authenticated;
grant execute on function public.review_d17_order(uuid,text,jsonb) to service_role;
