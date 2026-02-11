-- Buckets
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('cni', 'cni', false)
on conflict (id) do nothing;

-- Products bucket policies
drop policy if exists "products_read" on storage.objects;
create policy "products_read" on storage.objects
  for select using (bucket_id = 'products');

drop policy if exists "products_insert" on storage.objects;
create policy "products_insert" on storage.objects
  for insert with check (bucket_id = 'products' and auth.role() = 'authenticated');

drop policy if exists "products_update" on storage.objects;
create policy "products_update" on storage.objects
  for update using (bucket_id = 'products' and auth.role() = 'authenticated');

-- Avatars bucket policies
drop policy if exists "avatars_read" on storage.objects;
create policy "avatars_read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_insert" on storage.objects;
create policy "avatars_insert" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

drop policy if exists "avatars_update" on storage.objects;
create policy "avatars_update" on storage.objects
  for update using (bucket_id = 'avatars' and auth.role() = 'authenticated');

-- CNI bucket policies (private)
drop policy if exists "cni_read" on storage.objects;
create policy "cni_read" on storage.objects
  for select using (bucket_id = 'cni' and auth.role() = 'authenticated');

drop policy if exists "cni_insert" on storage.objects;
create policy "cni_insert" on storage.objects
  for insert with check (bucket_id = 'cni' and auth.role() = 'authenticated');

drop policy if exists "cni_update" on storage.objects;
create policy "cni_update" on storage.objects
  for update using (bucket_id = 'cni' and auth.role() = 'authenticated');
