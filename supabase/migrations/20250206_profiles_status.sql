alter table public.profiles add column if not exists status text default 'ACTIVE';
alter table public.profiles add column if not exists deleted_at timestamp with time zone;
create index if not exists idx_profiles_status on public.profiles(status);
