-- Extensions (optional)
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Reviews (table already exists in your DB)
alter table public.reviews add column if not exists user_name text;
alter table public.reviews add column if not exists user_id uuid references public.profiles(id) on delete set null;

-- Messages (B2B)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null,
  from_id uuid references public.profiles(id) on delete set null,
  from_name text,
  subject text,
  body text not null,
  status text default 'READ',
  created_at timestamp with time zone default now()
);

-- Deliveries
create table if not exists public.deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  seller_id uuid references public.profiles(id) on delete set null,
  customer_name text,
  address text,
  amount numeric,
  status text default 'PENDING',
  driver_name text,
  eta text,
  created_at timestamp with time zone default now()
);

-- Order items (to link orders to products/sellers)
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  seller_id uuid references public.profiles(id) on delete set null,
  quantity int not null,
  price numeric not null,
  created_at timestamp with time zone default now()
);

-- Orders: add seller_id (optional)
alter table public.orders add column if not exists seller_id uuid references public.profiles(id) on delete set null;

-- Tickets: add user_role for UI needs
alter table public.tickets add column if not exists user_role text;

-- Indexes
create index if not exists idx_reviews_product_id on public.reviews(product_id);
create index if not exists idx_messages_thread_id on public.messages(thread_id);
create index if not exists idx_deliveries_seller_id on public.deliveries(seller_id);
create index if not exists idx_order_items_seller_id on public.order_items(seller_id);
create index if not exists idx_order_items_order_id on public.order_items(order_id);

-- RLS
alter table public.reviews enable row level security;
alter table public.messages enable row level security;
alter table public.deliveries enable row level security;
alter table public.order_items enable row level security;
alter table public.orders enable row level security;
alter table public.tickets enable row level security;

-- Policies: Reviews (read all, insert if authenticated)
drop policy if exists "reviews_read" on public.reviews;
create policy "reviews_read" on public.reviews
  for select using (true);

drop policy if exists "reviews_insert" on public.reviews;
create policy "reviews_insert" on public.reviews
  for insert with check (auth.uid() is not null);

-- Policies: Messages (read/insert for authenticated)
drop policy if exists "messages_read" on public.messages;
create policy "messages_read" on public.messages
  for select using (auth.uid() is not null);

drop policy if exists "messages_insert" on public.messages;
create policy "messages_insert" on public.messages
  for insert with check (auth.uid() is not null);

-- Policies: Deliveries (read for authenticated + super admin)
drop policy if exists "deliveries_read" on public.deliveries;
create policy "deliveries_read" on public.deliveries
  for select using (
    auth.uid() is not null
    and (
      seller_id = auth.uid()
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'SUPER_ADMIN')
    )
  );

-- Policies: Orders (buyer, seller, or super admin)
drop policy if exists "orders_read" on public.orders;
create policy "orders_read" on public.orders
  for select using (
    buyer_id = auth.uid()
    or seller_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'SUPER_ADMIN')
  );

drop policy if exists "orders_insert" on public.orders;
create policy "orders_insert" on public.orders
  for insert with check (buyer_id = auth.uid());

drop policy if exists "orders_update" on public.orders;
create policy "orders_update" on public.orders
  for update using (
    buyer_id = auth.uid()
    or seller_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'SUPER_ADMIN')
  );

-- Policies: Order items (seller or super admin)
drop policy if exists "order_items_read" on public.order_items;
create policy "order_items_read" on public.order_items
  for select using (
    seller_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'SUPER_ADMIN')
  );

drop policy if exists "order_items_insert" on public.order_items;
create policy "order_items_insert" on public.order_items
  for insert with check (auth.uid() is not null);

-- Policies: Tickets (read/write for authenticated)
drop policy if exists "tickets_read" on public.tickets;
create policy "tickets_read" on public.tickets
  for select using (auth.uid() is not null);

drop policy if exists "tickets_insert" on public.tickets;
create policy "tickets_insert" on public.tickets
  for insert with check (auth.uid() is not null);

drop policy if exists "tickets_update" on public.tickets;
create policy "tickets_update" on public.tickets
  for update using (auth.uid() is not null);
