-- Helper functions that the generated schema migration's RLS policies and the trigger migration
-- depend on. Runs first (lowest timestamp). PL/pgSQL bodies are not resolved against tables at
-- creation time, so `public.is_admin()` may reference `admin_users` before that table exists.

create extension if not exists "pgcrypto";

-- True when the current Supabase Auth user has an active row in public.admin_users.
-- SECURITY DEFINER so it can read admin_users regardless of that table's own RLS policy
-- (avoids the self-referencing policy recursion); search_path pinned to block hijacking.
create or replace function public.is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return false;
  end if;
  return exists (
    select 1
    from public.admin_users au
    where au.auth_user_id = auth.uid()
      and au.is_active = true
  );
end;
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

comment on function public.is_admin() is
  'RLS helper: true when auth.uid() maps to an active public.admin_users row. Security definer.';

-- Maintains updated_at on every table (triggers are attached in the trigger migration).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'BEFORE UPDATE trigger function: sets updated_at = now() on every row update.';
