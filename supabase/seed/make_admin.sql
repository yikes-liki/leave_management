-- =============================================================================
-- TRUSTED ADMIN SETUP  (run manually in the Supabase SQL Editor - NOT a migration)
--
-- 1. Register the person normally through the app (they become an 'employee').
-- 2. Replace the email below and run this script.
-- This works because the SQL Editor runs with elevated database privileges.
-- The browser (anon / authenticated roles) can never run this.
-- =============================================================================
update public.user_roles
   set role = 'admin', granted_at = now()
 where user_id = (select id from auth.users where lower(email) = lower('admin@example.com'));

-- Verify (should return one row with role = admin):
select u.email, r.role
  from public.user_roles r join auth.users u on u.id = r.user_id
 where r.role = 'admin';
