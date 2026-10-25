-- =====================================================================
-- 005 PROFILES  (+ trigger signup, proteksi role, bucket 'profiles' & 'banners')
-- Butuh: 000-helpers, 001-countries
-- =====================================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text default 'user' check (role in ('admin', 'user')),
  name varchar,
  company_name varchar,
  bio text,
  avatar_url text,
  banner_url text,
  country_id uuid references public.countries(id),
  whatsapp varchar,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

-- ---------------------------------------------------------------------
-- Trigger: otomatis buat baris profile saat user sign up
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, company_name, country_id, role)
  values (
    new.id,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'company_name',
    (new.raw_user_meta_data->>'country_id')::uuid,
    'user'
  );
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Trigger: user biasa TIDAK boleh mengubah kolom role (mencegah user
-- menjadikan dirinya admin lewat API). Perubahan dari SQL Editor
-- (auth.uid() null) tetap diizinkan.
-- ---------------------------------------------------------------------
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Only admin can change role';
  end if;
  return new;
end $$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- ---------------------------------------------------------------------
-- Policy tabel profiles
-- ---------------------------------------------------------------------
do $$
declare r record;
begin
  for r in select policyname from pg_policies
           where schemaname = 'public' and tablename = 'profiles'
  loop
    execute format('drop policy %I on public.profiles', r.policyname);
  end loop;
end $$;

create policy "profiles_public_read" on public.profiles
  for select to public using (true);

create policy "profiles_admin_all" on public.profiles
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Baris profile dibuat oleh trigger, jadi user cukup boleh UPDATE miliknya.
create policy "profiles_owner_update" on public.profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- ---------------------------------------------------------------------
-- Storage: bucket 'profiles' (avatar) dan 'banners'
-- Path file harus <user_id>/<nama-file>
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('profiles', 'profiles', true), ('banners', 'banners', true)
on conflict (id) do nothing;

drop policy if exists "Public Access Profiles" on storage.objects;
drop policy if exists "Auth Upload Profiles" on storage.objects;
drop policy if exists "Auth Update Profiles" on storage.objects;
drop policy if exists "profiles_delete" on storage.objects;
drop policy if exists "Admin full storage access for profiles" on storage.objects;
drop policy if exists "Users can manage own folder in profiles" on storage.objects;
drop policy if exists "Allow public read access for profiles" on storage.objects;
drop policy if exists "storage_profiles_public_read" on storage.objects;
drop policy if exists "storage_profiles_admin_all" on storage.objects;
drop policy if exists "storage_profiles_owner_all" on storage.objects;

drop policy if exists "Public Access Banners" on storage.objects;
drop policy if exists "Auth Upload Banners" on storage.objects;
drop policy if exists "Auth Update Banners" on storage.objects;
drop policy if exists "banners_delete" on storage.objects;
drop policy if exists "storage_banners_public_read" on storage.objects;
drop policy if exists "storage_banners_admin_all" on storage.objects;
drop policy if exists "storage_banners_owner_all" on storage.objects;

create policy "storage_profiles_public_read" on storage.objects
  for select to public using (bucket_id = 'profiles');
create policy "storage_profiles_admin_all" on storage.objects
  for all to authenticated
  using (bucket_id = 'profiles' and public.is_admin())
  with check (bucket_id = 'profiles' and public.is_admin());
create policy "storage_profiles_owner_all" on storage.objects
  for all to authenticated
  using (bucket_id = 'profiles' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'profiles' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "storage_banners_public_read" on storage.objects
  for select to public using (bucket_id = 'banners');
create policy "storage_banners_admin_all" on storage.objects
  for all to authenticated
  using (bucket_id = 'banners' and public.is_admin())
  with check (bucket_id = 'banners' and public.is_admin());
create policy "storage_banners_owner_all" on storage.objects
  for all to authenticated
  using (bucket_id = 'banners' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'banners' and (storage.foldername(name))[1] = auth.uid()::text);