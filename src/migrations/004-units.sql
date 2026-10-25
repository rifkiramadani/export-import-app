-- =====================================================================
-- 003 UNITS
-- =====================================================================
create table if not exists public.units (
  id uuid default gen_random_uuid() primary key,
  name varchar not null
);

alter table public.units enable row level security;

do $$
declare r record;
begin
  for r in select policyname from pg_policies
           where schemaname = 'public' and tablename = 'units'
  loop
    execute format('drop policy %I on public.units', r.policyname);
  end loop;
end $$;

create policy "units_public_read" on public.units
  for select to public using (true);

create policy "units_admin_all" on public.units
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());