-- Add buyer/seller links to messages for proper filtering
alter table public.messages add column if not exists seller_id uuid references public.profiles(id) on delete set null;
alter table public.messages add column if not exists buyer_id uuid references public.profiles(id) on delete set null;

create index if not exists idx_messages_seller_id on public.messages(seller_id);
create index if not exists idx_messages_buyer_id on public.messages(buyer_id);
