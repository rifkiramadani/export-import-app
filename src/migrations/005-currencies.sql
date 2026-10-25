-- =====================================================================
-- 004 CURRENCIES
-- =====================================================================
create table if not exists public.currencies (
  id uuid default gen_random_uuid() primary key,
  code varchar not null,
  name varchar not null,
  symbol varchar not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.currencies enable row level security;

do $$
declare r record;
begin
  for r in select policyname from pg_policies
           where schemaname = 'public' and tablename = 'currencies'
  loop
    execute format('drop policy %I on public.currencies', r.policyname);
  end loop;
end $$;

create policy "currencies_public_read" on public.currencies
  for select to public using (true);

create policy "currencies_admin_all" on public.currencies
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());