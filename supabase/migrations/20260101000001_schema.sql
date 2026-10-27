-- =============================================================================
-- 001 - Core schema: enums, tables, constraints, indexes
-- Run order matters: 001 -> 002 -> 003 -> 004
-- =============================================================================

-- btree_gist lets an EXCLUSION constraint combine "same employee" (=) with
-- "overlapping dates" (&&). This stops overlapping leave even under race conditions.
create extension if not exists btree_gist with schema extensions;
set search_path = public, extensions;

-- ---------- Enumerated types ----------
create type public.app_role     as enum ('employee', 'admin');
create type public.leave_type   as enum ('casual', 'sick', 'earned');
create type public.leave_status as enum ('pending', 'approved', 'rejected', 'cancelled');

-- ---------- profiles ----------
-- One row per auth user. Created by a trigger (migration 002), never by the browser.
-- NOTE: profiles.role is a read-only MIRROR of public.user_roles for display.
-- Authorization decisions use public.is_admin(), which reads user_roles.
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null check (char_length(btrim(full_name)) between 1 and 120),
  email      text not null,
  role       public.app_role not null default 'employee',
  created_at timestamptz not null default now()
);
create unique index profiles_email_unique on public.profiles (lower(email)) where email <> '';

-- ---------- user_roles (the trusted source of authority) ----------
-- No INSERT/UPDATE/DELETE is granted to API roles. Only trusted SQL can change it.
create table public.user_roles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       public.app_role not null default 'employee',
  granted_by uuid references auth.users (id) on delete set null,
  granted_at timestamptz not null default now()
);

-- ---------- Policy / configuration ----------
-- Single-row settings table (the CHECK forces id = true, so only one row can exist).
create table public.leave_settings (
  id                      boolean primary key default true check (id),
  exclude_weekends        boolean not null default true,
  exclude_public_holidays boolean not null default true,
  allow_negative_balance  boolean not null default false,
  max_request_days        integer not null default 30 check (max_request_days > 0),
  sick_backdate_days      integer not null default 7  check (sick_backdate_days >= 0),
  timezone                text    not null default 'UTC',
  updated_at              timestamptz not null default now()
);
insert into public.leave_settings (id) values (true);

-- Default yearly entitlement per leave type. Used to initialise new employees.
create table public.leave_policy (
  leave_type   public.leave_type primary key,
  default_days numeric(5,1) not null check (default_days >= 0),
  description  text
);
insert into public.leave_policy (leave_type, default_days, description) values
  ('casual', 12, 'Short personal or planned time off'),
  ('sick',   10, 'Illness or medical appointments'),
  ('earned', 15, 'Accrued annual leave');

create table public.holidays (
  holiday_date date primary key,
  name         text not null check (char_length(btrim(name)) > 0)
);

-- ---------- leave_balances ----------
create table public.leave_balances (
  id             uuid primary key default gen_random_uuid(),
  employee_id    uuid not null references public.profiles (id) on delete cascade,
  leave_type     public.leave_type not null,
  total_days     numeric(5,1) not null default 0 check (total_days >= 0),
  used_days      numeric(5,1) not null default 0 check (used_days  >= 0),
  -- Available Leave = Total Entitlement - Used Leave (computed by the database, never stored by hand)
  available_days numeric(5,1) generated always as (total_days - used_days) stored,
  updated_at     timestamptz not null default now(),
  constraint leave_balances_employee_type_key unique (employee_id, leave_type)
);

-- ---------- leave_requests ----------
create table public.leave_requests (
  id               uuid primary key default gen_random_uuid(),
  employee_id      uuid not null references public.profiles (id) on delete cascade,
  leave_type       public.leave_type not null,
  start_date       date not null,
  end_date         date not null,
  total_days       numeric(5,1) not null check (total_days > 0),
  reason           text not null check (char_length(btrim(reason)) between 3 and 1000),
  status           public.leave_status not null default 'pending',
  admin_comment    text check (admin_comment is null or char_length(admin_comment) <= 1000),
  reviewed_by      uuid references public.profiles (id) on delete set null,
  reviewed_at      timestamptz,
  -- Idempotency guard: true only while this request's days are deducted from the balance.
  balance_deducted boolean not null default false,
  cancelled_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint leave_requests_dates_chk   check (end_date >= start_date),
  constraint leave_requests_pending_chk check (status <> 'pending' or reviewed_at is null),
  constraint leave_requests_deduct_chk  check (not balance_deducted or status = 'approved'),
  -- No two ACTIVE (pending/approved) requests for one employee may overlap.
  constraint leave_requests_no_overlap exclude using gist (
    employee_id with =,
    daterange(start_date, end_date, '[]') with &&
  ) where (status in ('pending', 'approved'))
);
create index leave_requests_employee_idx on public.leave_requests (employee_id, created_at desc);
create index leave_requests_status_idx   on public.leave_requests (status, created_at desc);
create index leave_requests_dates_idx    on public.leave_requests (start_date, end_date);
create index leave_requests_reviewer_idx on public.leave_requests (reviewed_by);

-- ---------- Audit tables (written only by trusted functions) ----------
create table public.balance_adjustments (
  id           bigint generated always as identity primary key,
  employee_id  uuid not null references public.profiles (id) on delete cascade,
  leave_type   public.leave_type not null,
  old_total    numeric(5,1) not null,
  new_total    numeric(5,1) not null,
  reason       text not null check (char_length(btrim(reason)) >= 3),
  adjusted_by  uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);
create index balance_adjustments_employee_idx on public.balance_adjustments (employee_id, created_at desc);

create table public.audit_log (
  id          bigint generated always as identity primary key,
  actor_id    uuid references public.profiles (id) on delete set null,
  action      text not null,
  entity_type text not null,
  entity_id   uuid,
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index audit_log_entity_idx on public.audit_log (entity_type, entity_id);
create index audit_log_created_idx on public.audit_log (created_at desc);
