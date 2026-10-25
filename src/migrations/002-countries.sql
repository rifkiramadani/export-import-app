-- =====================================================================
-- 001 COUNTRIES
-- =====================================================================
create table if not exists public.countries (
  id uuid default gen_random_uuid() primary key,
  name varchar not null,
  code varchar not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.countries enable row level security;

-- Hapus semua policy lama pada tabel ini, lalu buat ulang
do $$
declare r record;
begin
  for r in select policyname from pg_policies
           where schemaname = 'public' and tablename = 'countries'
  loop
    execute format('drop policy %I on public.countries', r.policyname);
  end loop;
end $$;

create policy "countries_public_read" on public.countries
  for select to public using (true);

create policy "countries_admin_all" on public.countries
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());