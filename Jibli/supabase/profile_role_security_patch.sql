-- Targeted security fix; apply in the Jibli Supabase SQL editor.
-- Does not alter existing administrator assignments.
begin;
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'authenticated' then
    if tg_op = 'INSERT' then
      -- Client-controlled profile email must never grant admin access.
      -- Confirmed auth.users triggers provision the administrator server-side.
      new.role = 'user';
      new.email = auth.jwt()->>'email';
    else
      new.role = old.role;
      new.email = old.email;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
before insert or update on public.profiles
for each row execute function public.protect_profile_role();

commit;
