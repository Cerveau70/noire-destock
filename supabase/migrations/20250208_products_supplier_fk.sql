do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'products_supplier_id_fkey'
  ) then
    alter table public.products
      add constraint products_supplier_id_fkey
      foreign key (supplier_id) references public.profiles(id) on delete set null;
  end if;
end $$;
