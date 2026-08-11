-- Run once in the Supabase SQL Editor for an existing database.
-- Fresh databases already include this constraint in initial_admin_content.sql.

begin;

update public.posts
set thumbnail_alt = null
where thumbnail_path is null
  and thumbnail_alt is not null;

alter table public.posts
  drop constraint if exists posts_thumbnail_alt_requires_path;

alter table public.posts
  add constraint posts_thumbnail_alt_requires_path
  check (thumbnail_path is not null or thumbnail_alt is null);

commit;
