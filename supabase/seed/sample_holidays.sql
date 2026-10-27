-- OPTIONAL demo data. Replace with your organisation's real holidays.
-- Run in the SQL Editor; keep demo data out of production unless intended.
insert into public.holidays (holiday_date, name) values
  ('2026-12-25', 'Christmas Day'),
  ('2027-01-01', 'New Year''s Day'),
  ('2027-01-26', 'Republic Day')
on conflict (holiday_date) do nothing;
