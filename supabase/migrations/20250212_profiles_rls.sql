-- RLS sur public.profiles : chaque utilisateur peut lire/modifier son profil; SUPER_ADMIN et ADMIN peuvent tout lire (ADMIN en lecture seule côté app).
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own_or_superadmin" on public.profiles;
create policy "profiles_select_own_or_superadmin" on public.profiles
  for select using (
    auth.uid() = id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('SUPER_ADMIN', 'ADMIN'))
  );

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
