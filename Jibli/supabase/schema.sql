create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  city text,
  address text,
  postal_code text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists address text;
alter table public.profiles add column if not exists postal_code text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists role text not null default 'user';
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_role_check'
  ) then
    alter table public.profiles
    add constraint profiles_role_check check (role in ('user', 'admin'));
  end if;
end;
$$;

create unique index if not exists only_one_admin
on public.profiles (role)
where role = 'admin';

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'submitted', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.carts add column if not exists updated_at timestamptz not null default now();

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  product_link text not null,
  shop text not null check (shop in ('aliexpress', 'shein')),
  product_name text,
  image_url text,
  selected_color text,
  selected_size text,
  selected_options jsonb not null default '{}'::jsonb,
  quantity int not null default 1 check (quantity > 0),
  estimated_price numeric,
  created_at timestamptz not null default now()
);

alter table public.cart_items add column if not exists image_url text;

alter table public.cart_items drop constraint if exists cart_items_shop_check;
alter table public.cart_items
add constraint cart_items_shop_check check (shop in ('aliexpress', 'shein', 'temu'));

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cart_id uuid references public.carts(id) on delete set null,
  status text not null default 'new_request',
  final_price numeric,
  deposit_amount numeric,
  tracking_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders add column if not exists updated_at timestamptz not null default now();

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders
add constraint orders_status_check check (
  status in (
    'new_request',
    'waiting_confirmation',
    'price_confirmed',
    'deposit_paid',
    'ordered',
    'preparing',
    'collected_by_carrier',
    'at_origin_sorting',
    'left_origin_sorting',
    'at_origin_airport',
    'awaiting_flight',
    'leaving_origin_country',
    'arrived_transit_country',
    'left_transit_country',
    'arrived_local_airport',
    'arrived_tunisia',
    'out_for_delivery',
    'delivered',
    'cancelled'
  )
);

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists carts_user_status_idx on public.carts(user_id, status);
create index if not exists cart_items_cart_idx on public.cart_items(cart_id);
create index if not exists cart_items_user_shop_idx on public.cart_items(user_id, shop);
create index if not exists orders_user_created_idx on public.orders(user_id, created_at desc);
create index if not exists orders_status_created_idx on public.orders(status, created_at desc);
create index if not exists order_events_order_created_idx on public.order_events(order_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_carts_updated_at on public.carts;
create trigger set_carts_updated_at
before update on public.carts
for each row execute function public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;

-- Only creates the profile row once Supabase has actually marked the email
-- confirmed (new.email_confirmed_at is set). This fires on both insert (OAuth
-- / admin-created / auto-confirm-enabled signups, where the email is already
-- confirmed at insert time) and on the later update that happens when a
-- customer verifies their code — so an unverified email/password signup
-- never gets a profiles row, and therefore never appears as a real account
-- anywhere in the app.
create or replace function public.handle_confirmed_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email_confirmed_at is null then
    return new;
  end if;

  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    case
      when lower(new.email) = 'sayanzzz2004@gmail.com' then 'admin'
      else 'user'
    end
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    phone = coalesce(public.profiles.phone, excluded.phone),
    role = case
      when lower(excluded.email) = 'sayanzzz2004@gmail.com' then 'admin'
      else public.profiles.role
    end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_confirmed_user();

drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
after update of email_confirmed_at on auth.users
for each row execute function public.handle_confirmed_user();

create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    email = new.email,
    role = case
      when lower(new.email) = 'sayanzzz2004@gmail.com' then 'admin'
      when role = 'admin' then 'user'
      else role
    end
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
after update of email on auth.users
for each row execute function public.sync_profile_email();

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'authenticated' then
    if tg_op = 'INSERT' then
      new.role = case
        when lower(coalesce(new.email, '')) = 'sayanzzz2004@gmail.com' then 'admin'
        else 'user'
      end;
    elsif new.role is distinct from old.role then
      new.role = old.role;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
before insert or update on public.profiles
for each row execute function public.protect_profile_role();

alter table public.profiles enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_events enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "Users can view own carts" on public.carts;
create policy "Users can view own carts"
on public.carts for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create own carts" on public.carts;
create policy "Users can create own carts"
on public.carts for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own carts" on public.carts;
create policy "Users can update own carts"
on public.carts for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can view own cart items" on public.cart_items;
create policy "Users can view own cart items"
on public.cart_items for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create own cart items" on public.cart_items;
create policy "Users can create own cart items"
on public.cart_items for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own cart items" on public.cart_items;
create policy "Users can delete own cart items"
on public.cart_items for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can view own orders" on public.orders;
create policy "Users can view own orders"
on public.orders for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create own orders" on public.orders;
create policy "Users can create own orders"
on public.orders for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can view own order events" on public.order_events;
create policy "Users can view own order events"
on public.order_events for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create own order events" on public.order_events;
create policy "Users can create own order events"
on public.order_events for insert
to authenticated
with check ((select auth.uid()) = user_id);

insert into public.profiles (id, email, full_name, phone, role)
select
  id,
  email,
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'phone',
  case
    when lower(email) = 'sayanzzz2004@gmail.com' then 'admin'
    else 'user'
  end
from auth.users
on conflict (id) do update
set
  email = excluded.email,
  role = case
    when lower(excluded.email) = 'sayanzzz2004@gmail.com' then 'admin'
    else public.profiles.role
  end;

update public.profiles
set role = 'user'
where role = 'admin'
and lower(coalesce(email, '')) <> 'sayanzzz2004@gmail.com';

update public.profiles
set role = 'admin'
where lower(coalesce(email, '')) = 'sayanzzz2004@gmail.com';
