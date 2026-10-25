-- =====================================================================
-- 002 CATEGORIES
-- =====================================================================
create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  name varchar not null,
  slug varchar not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.categories enable row level security;

do $$
declare r record;
begin
  for r in select policyname from pg_policies
           where schemaname = 'public' and tablename = 'categories'
  loop
    execute format('drop policy %I on public.categories', r.policyname);
  end loop;
end $$;

create policy "categories_public_read" on public.categories
  for select to public using (true);

create policy "categories_admin_all" on public.categories
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());