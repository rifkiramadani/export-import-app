create table public.categories (
  id uuid default gen_random_uuid() primary key,
  name varchar not null,
  slug varchar not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.categories enable row level security