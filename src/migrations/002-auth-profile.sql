DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

create table profiles (
  id uuid references auth.users on delete cascade primary key,
  role text default 'user' check (role in ('admin', 'user')),
  name varchar,
  company_name varchar,
  bio text,
  avatar_url text,
  banner_url text,
  country_id uuid references countries(id),
  whatsapp varchar,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

-- function & trigger automatically make row profile when user sign up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, company_name, country_id, role)
  values (
    new.id, 
    new.raw_user_meta_data->> 'name',
    new.raw_user_meta_data->> 'company_name',
    (new.raw_user_meta_data->>'country_id')::uuid,
    'user'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
