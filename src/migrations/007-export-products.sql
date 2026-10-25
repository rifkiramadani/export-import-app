-- =====================================================================
-- 006 EXPORT_PRODUCTS  (+ bucket 'export_products')
-- Butuh: 000-helpers, 001-countries, 002-categories, 003-units,
--        004-currencies, 005-profiles
-- =====================================================================
create table if not exists public.export_products (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete cascade not null,
  country_id uuid references public.countries(id) on delete cascade not null,
  title varchar not null,
  description text not null,
  price decimal(12, 2) not null,
  currency_id uuid references public.currencies(id) on delete cascade not null,
  quantity integer,
  unit_id uuid references public.units(id) on delete cascade not null,
  min_order numeric not null,
  whatsapp_number varchar not null,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Sinkronkan tabel lama yang sudah ada (database yang sudah berjalan):
-- typo create_at, kolom unit, dan quantity NOT NULL yang tidak dikirim form.
-- Di database baru blok ini tidak melakukan apa-apa.
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'export_products'
               and column_name = 'create_at') then
    alter table public.export_products rename column create_at to created_at;
  end if;

  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'export_products'
               and column_name = 'unit')
     and not exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'export_products'
               and column_name = 'unit_id') then
    alter table public.export_products rename column unit to unit_id;
  end if;

  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'export_products'
               and column_name = 'quantity') then
    alter table public.export_products alter column quantity drop not null;
  end if;
end $$;

alter table public.export_products enable row level security;

do $$
declare r record;
begin
  for r in select policyname from pg_policies
           where schemaname = 'public' and tablename = 'export_products'
  loop
    execute format('drop policy %I on public.export_products', r.policyname);
  end loop;
end $$;

create policy "export_products_public_read" on public.export_products
  for select to public using (true);

create policy "export_products_admin_all" on public.export_products
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "export_products_owner_all" on public.export_products
  for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ---------------------------------------------------------------------
-- Storage: bucket 'export_products'  (path: <user_id>/<nama-file>)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('export_products', 'export_products', true)
on conflict (id) do nothing;

drop policy if exists "Public Access Export Product image" on storage.objects;
drop policy if exists "Auth Upload export_products" on storage.objects;
drop policy if exists "Auth Update export_products" on storage.objects;
drop policy if exists "Users can upload export products to own folder" on storage.objects;
drop policy if exists "Users can delete own export products" on storage.objects;
drop policy if exists "Public can read export products" on storage.objects;
drop policy if exists "Admin full storage access for export_products" on storage.objects;
drop policy if exists "Users can manage own folder in export_products" on storage.objects;
drop policy if exists "Allow public read access for export_products" on storage.objects;
drop policy if exists "storage_export_products_public_read" on storage.objects;
drop policy if exists "storage_export_products_admin_all" on storage.objects;
drop policy if exists "storage_export_products_owner_all" on storage.objects;

create policy "storage_export_products_public_read" on storage.objects
  for select to public using (bucket_id = 'export_products');
create policy "storage_export_products_admin_all" on storage.objects
  for all to authenticated
  using (bucket_id = 'export_products' and public.is_admin())
  with check (bucket_id = 'export_products' and public.is_admin());
create policy "storage_export_products_owner_all" on storage.objects
  for all to authenticated
  using (bucket_id = 'export_products' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'export_products' and (storage.foldername(name))[1] = auth.uid()::text);