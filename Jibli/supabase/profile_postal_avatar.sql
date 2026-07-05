alter table public.profiles
add column if not exists postal_code text;

alter table public.profiles
add column if not exists avatar_url text;
