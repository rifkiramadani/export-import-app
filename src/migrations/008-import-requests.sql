-- =====================================================================
-- 007 IMPORT_REQUESTS  (+ bucket 'import_requests')
-- Butuh: 000-helpers, 001-countries, 002-categories, 003-units,
--        004-currencies, 005-profiles
-- =====================================================================
create table if not exists public.import_requests (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete cascade not null,
  country_id uuid references public.countries(id) on delete cascade not null,
  title varchar not null,
  description text not null,
  price numeric(12, 2) not null,
  currency_id uuid references public.currencies(id) on delete cascade not null,
  target_quantity integer not null,
  unit_id uuid references public.units(id) on delete cascade not null,
  whatsapp_number text not null,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.import_requests enable row level security;

do $$
declare r record;
begin
  for r in select policyname from pg_policies
           where schemaname = 'public' and tablename = 'import_requests'
  loop
    execute format('drop policy %I on public.import_requests', r.policyname);
  end loop;
end $$;

create policy "import_requests_public_read" on public.import_requests
  for select to public using (true);

create policy "import_requests_admin_all" on public.import_requests
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "import_requests_owner_all" on public.import_requests
  for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ---------------------------------------------------------------------
-- Storage: bucket 'import_requests'  (path: <user_id>/<nama-file>)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('import_requests', 'import_requests', true)
on conflict (id) do nothing;

drop policy if exists "Public Access Import Requests image" on storage.objects;
drop policy if exists "Auth Upload import_requests" on storage.objects;
drop policy if exists "Auth Update import_requests" on storage.objects;
drop policy if exists "Users can upload import images to own folder" on storage.objects;
drop policy if exists "Users can delete own import images" on storage.objects;
drop policy if exists "Public can read import images" on storage.objects;
drop policy if exists "Admin full storage access for import_requests" on storage.objects;
drop policy if exists "Users can manage own folder in import_requests" on storage.objects;
drop policy if exists "Allow public read access for import_requests" on storage.objects;
drop policy if exists "storage_import_requests_public_read" on storage.objects;
drop policy if exists "storage_import_requests_admin_all" on storage.objects;
drop policy if exists "storage_import_requests_owner_all" on storage.objects;

create policy "storage_import_requests_public_read" on storage.objects
  for select to public using (bucket_id = 'import_requests');
create policy "storage_import_requests_admin_all" on storage.objects
  for all to authenticated
  using (bucket_id = 'import_requests' and public.is_admin())
  with check (bucket_id = 'import_requests' and public.is_admin());
create policy "storage_import_requests_owner_all" on storage.objects
  for all to authenticated
  using (bucket_id = 'import_requests' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'import_requests' and (storage.foldername(name))[1] = auth.uid()::text);