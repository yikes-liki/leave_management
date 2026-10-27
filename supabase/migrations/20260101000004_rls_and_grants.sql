-- =============================================================================
-- 004 - Row Level Security, table privileges and function privileges
--
-- Defence in depth, two layers:
--   1. GRANTs   : which operations an API role may attempt at all.
--   2. RLS      : which ROWS those operations can see.
-- Supabase gives anon/authenticated broad default privileges, so we REVOKE first,
-- then grant back only what the app needs. The browser never gets INSERT/UPDATE/DELETE
-- on leave_requests or leave_balances: those changes go through the RPC functions.
-- =============================================================================

alter table public.profiles            enable row level security;
alter table public.user_roles          enable row level security;
alter table public.leave_settings      enable row level security;
alter table public.leave_policy        enable row level security;
alter table public.holidays            enable row level security;
alter table public.leave_balances      enable row level security;
alter table public.leave_requests      enable row level security;
alter table public.balance_adjustments enable row level security;
alter table public.audit_log           enable row level security;

-- ---------- Table privileges ----------
revoke all on table
  public.profiles, public.user_roles, public.leave_settings, public.leave_policy,
  public.holidays, public.leave_balances, public.leave_requests,
  public.balance_adjustments, public.audit_log
from anon, authenticated;

grant select on table
  public.profiles, public.user_roles, public.leave_settings, public.leave_policy,
  public.holidays, public.leave_balances, public.leave_requests,
  public.balance_adjustments, public.audit_log
to authenticated;

-- The ONLY column an employee can edit directly is their own display name.
grant update (full_name) on table public.profiles to authenticated;

-- ---------- profiles ----------
create policy profiles_select_own_or_admin on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());

create policy profiles_update_own_name on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ---------- user_roles (read-only for everyone; no write policies exist) ----------
create policy user_roles_select_own_or_admin on public.user_roles
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

-- ---------- Reference data: readable by signed-in users, writable only via trusted SQL ----------
create policy leave_settings_select on public.leave_settings for select to authenticated using (true);
create policy leave_policy_select   on public.leave_policy   for select to authenticated using (true);
create policy holidays_select       on public.holidays       for select to authenticated using (true);

-- ---------- leave_balances (read-only from the browser) ----------
create policy leave_balances_select_own_or_admin on public.leave_balances
  for select to authenticated
  using (employee_id = (select auth.uid()) or public.is_admin());

-- ---------- leave_requests (read-only from the browser) ----------
create policy leave_requests_select_own_or_admin on public.leave_requests
  for select to authenticated
  using (employee_id = (select auth.uid()) or public.is_admin());

-- ---------- Audit tables: administrators only ----------
create policy balance_adjustments_select_admin on public.balance_adjustments
  for select to authenticated using (public.is_admin());
create policy audit_log_select_admin on public.audit_log
  for select to authenticated using (public.is_admin());

-- ---------- Function privileges ----------
-- Remove the default "anyone may execute" grants, then allow only what is needed.
revoke all on function public.set_updated_at()                                          from public, anon, authenticated;
revoke all on function public.sync_profile_role()                                       from public, anon, authenticated;
revoke all on function public.handle_new_user()                                         from public, anon, authenticated;
revoke all on function public.is_admin()                                                from public, anon;
revoke all on function public.app_today()                                               from public, anon;
revoke all on function public.calculate_leave_days(date, date)                          from public, anon;
revoke all on function public.submit_leave_request(public.leave_type, date, date, text) from public, anon;
revoke all on function public.review_leave_request(uuid, text, text)                    from public, anon;
revoke all on function public.cancel_leave_request(uuid)                                from public, anon;
revoke all on function public.adjust_leave_balance(uuid, public.leave_type, numeric, text) from public, anon;
revoke all on function public.admin_dashboard_stats()                                   from public, anon;

grant execute on function public.is_admin()                                                to authenticated;
grant execute on function public.app_today()                                               to authenticated;
grant execute on function public.calculate_leave_days(date, date)                          to authenticated;
grant execute on function public.submit_leave_request(public.leave_type, date, date, text) to authenticated;
grant execute on function public.review_leave_request(uuid, text, text)                    to authenticated;
grant execute on function public.cancel_leave_request(uuid)                                to authenticated;
grant execute on function public.adjust_leave_balance(uuid, public.leave_type, numeric, text) to authenticated;
grant execute on function public.admin_dashboard_stats()                                   to authenticated;
