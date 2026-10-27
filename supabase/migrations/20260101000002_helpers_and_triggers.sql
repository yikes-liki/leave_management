-- =============================================================================
-- 002 - Helper functions and triggers
-- All SECURITY DEFINER functions use an EMPTY search_path and fully qualified names,
-- which blocks search_path hijacking.
-- =============================================================================

-- Generic updated_at maintenance
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger leave_balances_set_updated_at before update on public.leave_balances
  for each row execute function public.set_updated_at();
create trigger leave_requests_set_updated_at before update on public.leave_requests
  for each row execute function public.set_updated_at();
create trigger leave_settings_set_updated_at before update on public.leave_settings
  for each row execute function public.set_updated_at();

-- Is the CURRENT caller an administrator? Reads user_roles (trusted), not profiles.role.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid()) and ur.role = 'admin'
  );
$$;

-- Today's date in the organisation's configured time zone (leave_settings.timezone).
create or replace function public.app_today()
returns date language sql stable security definer set search_path = '' as $$
  select (now() at time zone (select s.timezone from public.leave_settings s where s.id))::date;
$$;

-- Keep the display-only profiles.role in sync with the trusted user_roles table.
create or replace function public.sync_profile_role()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set role = new.role where id = new.user_id;
  return new;
end $$;

create trigger user_roles_sync_profile
  after insert or update of role on public.user_roles
  for each row execute function public.sync_profile_role();

-- On every sign-up: create profile + employee role + starting balances.
-- Runs inside the same transaction as the auth.users insert, so it works whether or
-- not email verification is required. Role is ALWAYS 'employee' - metadata is never trusted.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_name text;
begin
  v_name := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');
  if v_name is null then
    v_name := nullif(btrim(split_part(coalesce(new.email, ''), '@', 1)), '');
  end if;
  v_name := left(coalesce(v_name, 'Employee'), 120);

  insert into public.profiles (id, full_name, email)
  values (new.id, v_name, coalesce(new.email, ''));

  insert into public.user_roles (user_id, role) values (new.id, 'employee');

  insert into public.leave_balances (employee_id, leave_type, total_days)
  select new.id, p.leave_type, p.default_days from public.leave_policy p;

  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Leave-day calculation (configurable via leave_settings + holidays).
-- Counts calendar days between start and end (inclusive), then skips weekends
-- and/or public holidays according to the settings. Half-days are NOT supported (v1).
create or replace function public.calculate_leave_days(p_start date, p_end date)
returns numeric language plpgsql stable set search_path = '' as $$
declare
  s public.leave_settings;
  v_days numeric;
begin
  if p_start is null or p_end is null then
    raise exception 'Start and end dates are required.' using errcode = 'LM001';
  end if;
  if p_end < p_start then
    raise exception 'The end date cannot be earlier than the start date.' using errcode = 'LM001';
  end if;
  if p_end - p_start > 366 then
    raise exception 'The date range is too long.' using errcode = 'LM001';
  end if;

  select * into s from public.leave_settings where id;

  select count(*) into v_days
  from generate_series(0, p_end - p_start) as g(i)
  where (not s.exclude_weekends or extract(isodow from (p_start + g.i)) < 6)
    and (not s.exclude_public_holidays
         or not exists (select 1 from public.holidays h where h.holiday_date = p_start + g.i));

  return v_days;
end $$;
