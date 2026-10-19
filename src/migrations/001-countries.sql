create table public.countries (
  id uuid default gen_random_uuid() primary key,
  name varchar not null,
  code varchar not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
); 

alter table public.countries enable row level security;