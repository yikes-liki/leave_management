-- =============================================================================
-- 003 - Trusted RPC functions (the ONLY way the app changes requests/balances)
--
-- Error codes (SQLSTATE) used so the UI can show friendly messages safely:
--   LM001 validation   LM002 insufficient balance   LM003 overlapping request
--   LM004 not authorised   LM005 invalid state   LM006 not found
-- =============================================================================

-- ---------------------------------------------------------------------------
-- submit_leave_request: employee creates a PENDING request for THEMSELVES.
-- total_days is computed here, so the browser can never choose its own day count.
-- ---------------------------------------------------------------------------
create or replace function public.submit_leave_request(
  p_leave_type public.leave_type,
  p_start_date date,
  p_end_date   date,
  p_reason     text
)
returns public.leave_requests
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid       uuid := (select auth.uid());
  s           public.leave_settings;
  v_reason    text := btrim(coalesce(p_reason, ''));
  v_days      numeric;
  v_available numeric;
  v_earliest  date;
  v_row       public.leave_requests;
begin
  if v_uid is null then
    raise exception 'You must be signed in.' using errcode = 'LM004';
  end if;
  if not exists (select 1 from public.profiles where id = v_uid) then
    raise exception 'Your employee profile was not found.' using errcode = 'LM006';
  end if;
  if p_leave_type is null or p_start_date is null or p_end_date is null then
    raise exception 'Leave type, start date and end date are required.' using errcode = 'LM001';
  end if;
  if char_length(v_reason) < 3 or char_length(v_reason) > 1000 then
    raise exception 'Please give a reason between 3 and 1000 characters.' using errcode = 'LM001';
  end if;

  select * into s from public.leave_settings where id;

  v_earliest := public.app_today()
    - case when p_leave_type = 'sick' then s.sick_backdate_days else 0 end;
  if p_start_date < v_earliest then
    raise exception 'The start date cannot be in the past.' using errcode = 'LM001';
  end if;

  v_days := public.calculate_leave_days(p_start_date, p_end_date);
  if v_days <= 0 then
    raise exception 'The selected dates contain no working days.' using errcode = 'LM001';
  end if;
  if v_days > s.max_request_days then
    raise exception 'A single request cannot exceed % working days.', s.max_request_days
      using errcode = 'LM001';
  end if;

  if exists (
    select 1 from public.leave_requests r
    where r.employee_id = v_uid
      and r.status in ('pending', 'approved')
      and daterange(r.start_date, r.end_date, '[]') && daterange(p_start_date, p_end_date, '[]')
  ) then
    raise exception 'These dates overlap with another pending or approved request.'
      using errcode = 'LM003';
  end if;

  select b.available_days into v_available
  from public.leave_balances b
  where b.employee_id = v_uid and b.leave_type = p_leave_type;
  if not found then
    raise exception 'No leave balance is set up for this leave type.' using errcode = 'LM006';
  end if;
  if not s.allow_negative_balance and v_available < v_days then
    raise exception 'Insufficient % leave: % day(s) requested but only % available.',
      p_leave_type, v_days, v_available using errcode = 'LM002';
  end if;

  begin
    insert into public.leave_requests (employee_id, leave_type, start_date, end_date, total_days, reason)
    values (v_uid, p_leave_type, p_start_date, p_end_date, v_days, v_reason)
    returning * into v_row;
  exception when exclusion_violation then
    raise exception 'These dates overlap with another pending or approved request.'
      using errcode = 'LM003';
  end;

  return v_row;
end $$;

-- ---------------------------------------------------------------------------
-- review_leave_request: admin approves or rejects a PENDING request, atomically.
-- Lock order is always request -> balance, which prevents deadlocks.
-- ---------------------------------------------------------------------------
create or replace function public.review_leave_request(
  p_request_id uuid,
  p_decision   text,
  p_comment    text default null
)
returns public.leave_requests
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid     uuid := (select auth.uid());
  v_req     public.leave_requests;
  v_bal     public.leave_balances;
  s         public.leave_settings;
  v_comment text := nullif(btrim(coalesce(p_comment, '')), '');
begin
  if v_uid is null or not public.is_admin() then
    raise exception 'Only administrators can review leave requests.' using errcode = 'LM004';
  end if;
  if p_decision is null or p_decision not in ('approved', 'rejected') then
    raise exception 'Decision must be approved or rejected.' using errcode = 'LM001';
  end if;
  if v_comment is not null and char_length(v_comment) > 1000 then
    raise exception 'The comment cannot exceed 1000 characters.' using errcode = 'LM001';
  end if;

  select * into v_req from public.leave_requests where id = p_request_id for update;
  if not found then
    raise exception 'Leave request not found.' using errcode = 'LM006';
  end if;
  if v_req.employee_id = v_uid then
    raise exception 'You cannot review your own leave request.' using errcode = 'LM004';
  end if;
  if v_req.status <> 'pending' then
    raise exception 'This request is already %.', v_req.status using errcode = 'LM005';
  end if;

  if p_decision = 'approved' then
    select * into s from public.leave_settings where id;

    select * into v_bal from public.leave_balances
    where employee_id = v_req.employee_id and leave_type = v_req.leave_type
    for update;
    if not found then
      raise exception 'The employee has no balance for this leave type.' using errcode = 'LM006';
    end if;
    if v_req.balance_deducted then
      raise exception 'This request has already been deducted.' using errcode = 'LM005';
    end if;
    if not s.allow_negative_balance and (v_bal.total_days - v_bal.used_days) < v_req.total_days then
      raise exception 'Cannot approve: employee has % day(s) available but the request needs %.',
        (v_bal.total_days - v_bal.used_days), v_req.total_days using errcode = 'LM002';
    end if;

    update public.leave_balances
       set used_days = used_days + v_req.total_days
     where id = v_bal.id;
  end if;

  update public.leave_requests
     set status           = p_decision::public.leave_status,
         admin_comment    = v_comment,
         reviewed_by      = v_uid,
         reviewed_at      = now(),
         balance_deducted = (p_decision = 'approved')
   where id = v_req.id
   returning * into v_req;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, details)
  values (v_uid, 'leave_request.' || p_decision, 'leave_request', v_req.id,
          jsonb_build_object('employee_id', v_req.employee_id, 'leave_type', v_req.leave_type,
                             'days', v_req.total_days, 'comment', v_comment));
  return v_req;
end $$;

-- ---------------------------------------------------------------------------
-- cancel_leave_request: employee cancels THEIR OWN request.
-- Rules: pending -> always allowed. approved -> only before its start date, and the
-- deduction is reversed. rejected/cancelled -> not allowed.
-- ---------------------------------------------------------------------------
create or replace function public.cancel_leave_request(p_request_id uuid)
returns public.leave_requests
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_req public.leave_requests;
begin
  if v_uid is null then
    raise exception 'You must be signed in.' using errcode = 'LM004';
  end if;

  select * into v_req from public.leave_requests
  where id = p_request_id and employee_id = v_uid
  for update;
  if not found then
    -- Same message whether it does not exist or belongs to someone else (no information leak).
    raise exception 'Leave request not found.' using errcode = 'LM006';
  end if;

  if v_req.status = 'approved' then
    if v_req.start_date <= public.app_today() then
      raise exception 'Approved leave that has already started cannot be cancelled.'
        using errcode = 'LM005';
    end if;
  elsif v_req.status <> 'pending' then
    raise exception 'This request is already %.', v_req.status using errcode = 'LM005';
  end if;

  if v_req.balance_deducted then
    update public.leave_balances
       set used_days = greatest(used_days - v_req.total_days, 0)
     where employee_id = v_req.employee_id and leave_type = v_req.leave_type;
  end if;

  update public.leave_requests
     set status = 'cancelled', cancelled_at = now(), balance_deducted = false
   where id = v_req.id
   returning * into v_req;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, details)
  values (v_uid, 'leave_request.cancelled', 'leave_request', v_req.id,
          jsonb_build_object('days', v_req.total_days, 'leave_type', v_req.leave_type));
  return v_req;
end $$;

-- ---------------------------------------------------------------------------
-- adjust_leave_balance: admin sets an employee's TOTAL entitlement (audited).
-- ---------------------------------------------------------------------------
create or replace function public.adjust_leave_balance(
  p_employee_id uuid,
  p_leave_type  public.leave_type,
  p_new_total   numeric,
  p_reason      text
)
returns public.leave_balances
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid    uuid := (select auth.uid());
  v_bal    public.leave_balances;
  s        public.leave_settings;
  v_reason text := btrim(coalesce(p_reason, ''));
  v_old    numeric;
begin
  if v_uid is null or not public.is_admin() then
    raise exception 'Only administrators can adjust leave balances.' using errcode = 'LM004';
  end if;
  if p_new_total is null or p_new_total < 0 or p_new_total > 999 or p_new_total <> round(p_new_total, 1) then
    raise exception 'Total days must be between 0 and 999 with at most one decimal place.'
      using errcode = 'LM001';
  end if;
  if char_length(v_reason) < 3 or char_length(v_reason) > 500 then
    raise exception 'Please give a reason (3 to 500 characters) for this adjustment.'
      using errcode = 'LM001';
  end if;

  select * into s from public.leave_settings where id;

  select * into v_bal from public.leave_balances
  where employee_id = p_employee_id and leave_type = p_leave_type
  for update;
  if not found then
    raise exception 'Leave balance not found.' using errcode = 'LM006';
  end if;
  if not s.allow_negative_balance and p_new_total < v_bal.used_days then
    raise exception 'The new total (%) is below the days already used (%).',
      p_new_total, v_bal.used_days using errcode = 'LM002';
  end if;

  v_old := v_bal.total_days;
  update public.leave_balances set total_days = p_new_total
   where id = v_bal.id returning * into v_bal;

  insert into public.balance_adjustments (employee_id, leave_type, old_total, new_total, reason, adjusted_by)
  values (p_employee_id, p_leave_type, v_old, p_new_total, v_reason, v_uid);

  insert into public.audit_log (actor_id, action, entity_type, entity_id, details)
  values (v_uid, 'leave_balance.adjusted', 'leave_balance', v_bal.id,
          jsonb_build_object('employee_id', p_employee_id, 'leave_type', p_leave_type,
                             'old_total', v_old, 'new_total', p_new_total, 'reason', v_reason));
  return v_bal;
end $$;

-- ---------------------------------------------------------------------------
-- admin_dashboard_stats: aggregate numbers for the admin dashboard (admin only).
-- ---------------------------------------------------------------------------
create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not public.is_admin() then
    raise exception 'Only administrators can view dashboard statistics.' using errcode = 'LM004';
  end if;

  return jsonb_build_object(
    'total_employees', (select count(*) from public.user_roles where role = 'employee'),
    'requests', (
      select jsonb_build_object(
        'total',     count(*),
        'pending',   count(*) filter (where status = 'pending'),
        'approved',  count(*) filter (where status = 'approved'),
        'rejected',  count(*) filter (where status = 'rejected'),
        'cancelled', count(*) filter (where status = 'cancelled'))
      from public.leave_requests),
    'by_type', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'leave_type', p.leave_type,
               'requests', coalesce(x.requests, 0),
               'approved_days', coalesce(x.approved_days, 0)) order by p.leave_type), '[]'::jsonb)
      from public.leave_policy p
      left join (
        select leave_type, count(*) as requests,
               coalesce(sum(total_days) filter (where status = 'approved'), 0) as approved_days
        from public.leave_requests group by leave_type) x on x.leave_type = p.leave_type),
    'monthly', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'month', to_char(m.m, 'YYYY-MM'),
               'requests', coalesce(x.requests, 0),
               'approved_days', coalesce(x.approved_days, 0)) order by m.m), '[]'::jsonb)
      from generate_series(
             date_trunc('month', public.app_today()::timestamp) - interval '5 months',
             date_trunc('month', public.app_today()::timestamp),
             interval '1 month') as m(m)
      left join (
        select date_trunc('month', start_date::timestamp) as mm, count(*) as requests,
               coalesce(sum(total_days) filter (where status = 'approved'), 0) as approved_days
        from public.leave_requests group by 1) x on x.mm = m.m)
  );
end $$;
