create extension if not exists "pgcrypto";

-- Orders: escrow & payout tracking + payment reference
alter table public.orders add column if not exists payout_status text default 'PENDING';
alter table public.orders add column if not exists escrow_amount numeric default 0;
alter table public.orders add column if not exists seller_amount numeric default 0;
alter table public.orders add column if not exists commission_amount numeric default 0;
alter table public.orders add column if not exists payment_ref text;

-- Profiles: per-seller commission rate
alter table public.profiles add column if not exists commission_rate numeric default 0.12;
update public.profiles set commission_rate = 0.08 where role = 'PARTNER_ADMIN';

-- Profiles: CNI verification
alter table public.profiles add column if not exists cni_status text default 'PENDING';
alter table public.profiles add column if not exists cni_recto_url text;
alter table public.profiles add column if not exists cni_verso_url text;
alter table public.profiles add column if not exists cni_verified_at timestamp with time zone;
alter table public.profiles add column if not exists cni_verified_by uuid references public.profiles(id) on delete set null;

-- Wallet transactions (ledger)
create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  type text not null,
  amount numeric not null,
  status text default 'PENDING',
  reference_id uuid,
  payment_ref text,
  meta jsonb,
  created_at timestamp with time zone default now()
);

-- Payout requests (seller withdrawals)
create table if not exists public.payout_requests (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.profiles(id) on delete set null,
  amount numeric not null,
  method text not null,
  phone text,
  status text default 'PENDING',
  created_at timestamp with time zone default now()
);

-- Indexes
create index if not exists idx_wallet_transactions_user_id on public.wallet_transactions(user_id);
create index if not exists idx_payout_requests_seller_id on public.payout_requests(seller_id);
create index if not exists idx_orders_payment_ref on public.orders(payment_ref);

-- RLS
alter table public.wallet_transactions enable row level security;
alter table public.payout_requests enable row level security;

-- Policies: wallet transactions (owner or super admin)
drop policy if exists "wallet_transactions_read" on public.wallet_transactions;
create policy "wallet_transactions_read" on public.wallet_transactions
  for select using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'SUPER_ADMIN')
  );

drop policy if exists "wallet_transactions_insert" on public.wallet_transactions;
create policy "wallet_transactions_insert" on public.wallet_transactions
  for insert with check (auth.uid() is not null);

drop policy if exists "wallet_transactions_update" on public.wallet_transactions;
create policy "wallet_transactions_update" on public.wallet_transactions
  for update using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'SUPER_ADMIN')
  );

-- Policies: payout requests (seller or super admin)
drop policy if exists "payout_requests_read" on public.payout_requests;
create policy "payout_requests_read" on public.payout_requests
  for select using (
    seller_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'SUPER_ADMIN')
  );

drop policy if exists "payout_requests_insert" on public.payout_requests;
create policy "payout_requests_insert" on public.payout_requests
  for insert with check (seller_id = auth.uid());

drop policy if exists "payout_requests_update" on public.payout_requests;
create policy "payout_requests_update" on public.payout_requests
  for update using (
    seller_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'SUPER_ADMIN')
  );
