-- Run this file once in the Supabase SQL Editor.
-- Sign in again afterward so the new app_metadata claim is issued in the JWT.

do $$
declare
  admin_email constant text := 'asd@asd.com';
  updated_users integer;
begin
  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
    || '{"role":"admin"}'::jsonb
  where lower(email) = lower(admin_email);

  get diagnostics updated_users = row_count;

  if updated_users <> 1 then
    raise exception 'Expected exactly one Auth user for %, found %.', admin_email, updated_users;
  end if;
end;
$$;
