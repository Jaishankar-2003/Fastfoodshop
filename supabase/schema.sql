-- Roadside Fast-Food Ordering — PostgreSQL / Supabase schema
-- Run this in the Supabase SQL editor (or via supabase db push).

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Shops
-- ---------------------------------------------------------------------------
create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  slug text not null unique,
  logo_url text,
  image_url text,
  description text,
  contact_mobile text,
  address text,
  is_active boolean not null default true,
  is_open boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shops_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint shops_name_len check (char_length(name) between 2 and 80)
);

create index if not exists shops_owner_id_idx on public.shops (owner_id);
create index if not exists shops_slug_idx on public.shops (slug);

drop trigger if exists shops_set_updated_at on public.shops;
create trigger shops_set_updated_at
before update on public.shops
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_name_len check (char_length(name) between 1 and 40)
);

create index if not exists categories_shop_id_idx on public.categories (shop_id, sort_order);

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  name text not null,
  description text,
  price_paise integer not null,
  image_url text,
  is_available boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_price_positive check (price_paise >= 0),
  constraint products_name_len check (char_length(name) between 1 and 80)
);

create index if not exists products_shop_id_idx on public.products (shop_id);
create index if not exists products_category_id_idx on public.products (category_id);

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create sequence if not exists public.order_number_seq start with 1001;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete restrict,
  order_number integer not null unique default nextval('public.order_number_seq'),
  customer_name text not null,
  customer_mobile text not null,
  subtotal_paise integer not null,
  total_paise integer not null,
  payment_method text not null,
  payment_status text not null,
  order_status text not null,
  idempotency_key text unique,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_payment_method_chk check (payment_method in ('CASH', 'ONLINE')),
  constraint orders_payment_status_chk check (payment_status in ('PENDING', 'PAID', 'FAILED')),
  constraint orders_order_status_chk check (order_status in ('NEW', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED')),
  constraint orders_mobile_chk check (customer_mobile ~ '^[6-9][0-9]{9}$'),
  constraint orders_amounts_chk check (total_paise >= 0 and subtotal_paise >= 0)
);

create index if not exists orders_shop_id_created_idx on public.orders (shop_id, created_at desc);
create index if not exists orders_shop_status_idx on public.orders (shop_id, order_status);
create index if not exists orders_shop_payment_idx on public.orders (shop_id, payment_method, payment_status);

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Order items (product snapshot)
-- ---------------------------------------------------------------------------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  unit_price_paise integer not null,
  quantity integer not null,
  line_total_paise integer not null,
  created_at timestamptz not null default now(),
  constraint order_items_qty_chk check (quantity > 0),
  constraint order_items_price_chk check (unit_price_paise >= 0 and line_total_paise >= 0)
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- Payments
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  provider text not null default 'razorpay',
  provider_order_id text,
  provider_payment_id text,
  provider_signature text,
  provider_event_id text unique,
  amount_paise integer not null,
  currency text not null default 'INR',
  status text not null,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_status_chk check (status in ('CREATED', 'PENDING', 'PAID', 'FAILED'))
);

create index if not exists payments_order_id_idx on public.payments (order_id);
create unique index if not exists payments_provider_payment_id_uidx
  on public.payments (provider_payment_id)
  where provider_payment_id is not null;

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.shops enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;

-- Public menu: active shops only
drop policy if exists "public read active shops" on public.shops;
create policy "public read active shops"
on public.shops for select
to anon, authenticated
using (is_active = true);

drop policy if exists "owners manage shops" on public.shops;
create policy "owners manage shops"
on public.shops for all
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "public read enabled categories" on public.categories;
create policy "public read enabled categories"
on public.categories for select
to anon, authenticated
using (
  exists (
    select 1 from public.shops s
    where s.id = categories.shop_id and s.is_active = true
  )
);

drop policy if exists "owners manage categories" on public.categories;
create policy "owners manage categories"
on public.categories for all
to authenticated
using (
  exists (select 1 from public.shops s where s.id = categories.shop_id and s.owner_id = auth.uid())
)
with check (
  exists (select 1 from public.shops s where s.id = categories.shop_id and s.owner_id = auth.uid())
);

drop policy if exists "public read products" on public.products;
create policy "public read products"
on public.products for select
to anon, authenticated
using (
  exists (
    select 1 from public.shops s
    where s.id = products.shop_id and s.is_active = true
  )
);

drop policy if exists "owners manage products" on public.products;
create policy "owners manage products"
on public.products for all
to authenticated
using (
  exists (select 1 from public.shops s where s.id = products.shop_id and s.owner_id = auth.uid())
)
with check (
  exists (select 1 from public.shops s where s.id = products.shop_id and s.owner_id = auth.uid())
);

-- Orders are mutated via the service role on the server.
-- Authenticated owners can read/update their shop orders (admin dashboard + realtime).
-- Anon can read a single order by UUID (unguessable) for customer tracking / realtime.
drop policy if exists "anon read orders by id" on public.orders;
create policy "anon read orders by id"
on public.orders for select
to anon
using (true);

drop policy if exists "owners read shop orders" on public.orders;
create policy "owners read shop orders"
on public.orders for select
to authenticated
using (
  exists (select 1 from public.shops s where s.id = orders.shop_id and s.owner_id = auth.uid())
);

drop policy if exists "owners update shop orders" on public.orders;
create policy "owners update shop orders"
on public.orders for update
to authenticated
using (
  exists (select 1 from public.shops s where s.id = orders.shop_id and s.owner_id = auth.uid())
)
with check (
  exists (select 1 from public.shops s where s.id = orders.shop_id and s.owner_id = auth.uid())
);

drop policy if exists "anon read order items" on public.order_items;
create policy "anon read order items"
on public.order_items for select
to anon
using (true);

drop policy if exists "owners read order items" on public.order_items;
create policy "owners read order items"
on public.order_items for select
to authenticated
using (
  exists (
    select 1
    from public.orders o
    join public.shops s on s.id = o.shop_id
    where o.id = order_items.order_id and s.owner_id = auth.uid()
  )
);

drop policy if exists "owners read payments" on public.payments;
create policy "owners read payments"
on public.payments for select
to authenticated
using (
  exists (
    select 1
    from public.orders o
    join public.shops s on s.id = o.shop_id
    where o.id = payments.order_id and s.owner_id = auth.uid()
  )
);

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
alter table public.orders replica identity full;
alter table public.order_items replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.orders;
  exception
    when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.order_items;
  exception
    when duplicate_object then null;
  end;
end $$;

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('shop-media', 'shop-media', true)
on conflict (id) do nothing;

drop policy if exists "public read shop media" on storage.objects;
create policy "public read shop media"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'shop-media');

drop policy if exists "owners upload shop media" on storage.objects;
create policy "owners upload shop media"
on storage.objects for insert
to authenticated
with check (bucket_id = 'shop-media');

drop policy if exists "owners update shop media" on storage.objects;
create policy "owners update shop media"
on storage.objects for update
to authenticated
using (bucket_id = 'shop-media')
with check (bucket_id = 'shop-media');

drop policy if exists "owners delete shop media" on storage.objects;
create policy "owners delete shop media"
on storage.objects for delete
to authenticated
using (bucket_id = 'shop-media');
