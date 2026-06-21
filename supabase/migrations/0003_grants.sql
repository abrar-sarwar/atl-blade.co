-- =============================================================================
-- Table privileges for the Data API roles.
--
-- Recent Supabase/Postgres defaults do NOT auto-expose new public tables to the
-- API roles, so PostgREST returns "permission denied" until table-level GRANTs
-- exist. RLS policies (migration 0002) still do the row-level gating; these
-- GRANTs only open the tables at the privilege level.
--   * service_role: full access (bypasses RLS — used by server-side admin code).
--   * authenticated: full DML, but every row is gated by RLS (admin-only writes).
--   * anon: read-only, gated by RLS to active storefront content.
-- =============================================================================

grant usage on schema public to anon, authenticated, service_role;

-- service_role bypasses RLS; give it everything.
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant all privileges on all functions in schema public to service_role;

-- authenticated: DML allowed at the privilege level; RLS restricts to admins
-- (or to a user's own rows) per the policies in 0002_rls.sql.
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- anon: read-only; RLS narrows this to active products/categories/images and
-- the public settings tables.
grant select on all tables in schema public to anon;

-- Allow calling the helper functions through the API.
grant execute on function public.is_admin() to anon, authenticated, service_role;
grant execute on function public.make_admin(text) to service_role;

-- Cover any tables added by later migrations automatically.
alter default privileges in schema public
  grant all privileges on tables to service_role;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant select on tables to anon;
alter default privileges in schema public
  grant all privileges on sequences to service_role;
alter default privileges in schema public
  grant usage, select on sequences to authenticated;
