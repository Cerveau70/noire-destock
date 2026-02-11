create extension if not exists "pgcrypto";

-- Order item status history
create table if not exists public.order_item_status (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  status text not null,
  note text,
  created_at timestamp with time zone default now()
);

-- Delivery events history
create table if not exists public.delivery_events (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.deliveries(id) on delete cascade,
  status text not null,
  note text,
  created_at timestamp with time zone default now()
);

-- Indexes
create index if not exists idx_order_item_status_order_item_id on public.order_item_status(order_item_id);
create index if not exists idx_delivery_events_delivery_id on public.delivery_events(delivery_id);

-- RLS
alter table public.order_item_status enable row level security;
alter table public.delivery_events enable row level security;

-- Policies: Order item status (seller or super admin)
drop policy if exists "order_item_status_read" on public.order_item_status;
create policy "order_item_status_read" on public.order_item_status
  for select using (
    exists (
      select 1
      from public.order_items oi
      where oi.id = order_item_status.order_item_id
        and (
          oi.seller_id = auth.uid()
          or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'SUPER_ADMIN')
        )
    )
  );

drop policy if exists "order_item_status_insert" on public.order_item_status;
create policy "order_item_status_insert" on public.order_item_status
  for insert with check (auth.uid() is not null);

-- Policies: Delivery events (seller or super admin)
drop policy if exists "delivery_events_read" on public.delivery_events;
create policy "delivery_events_read" on public.delivery_events
  for select using (
    exists (
      select 1
      from public.deliveries d
      where d.id = delivery_events.delivery_id
        and (
          d.seller_id = auth.uid()
          or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'SUPER_ADMIN')
        )
    )
  );

drop policy if exists "delivery_events_insert" on public.delivery_events;
create policy "delivery_events_insert" on public.delivery_events
  for insert with check (auth.uid() is not null);