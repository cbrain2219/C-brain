begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

alter table public.posts
  add column if not exists thumbnail_file_name text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.posts'::regclass
      and conname = 'posts_thumbnail_file_name_requires_path'
  ) then
    alter table public.posts
      add constraint posts_thumbnail_file_name_requires_path
      check (
        thumbnail_file_name is null
        or (
          thumbnail_path is not null
          and nullif(btrim(thumbnail_file_name), '') is not null
        )
      ) not valid;
  end if;
end;
$$;

alter table public.posts
  validate constraint posts_thumbnail_file_name_requires_path;

-- The original upload name is admin-only metadata. Existing anonymous
-- column grants remain intact; no anonymous grant is added for this column.
revoke select on table public.posts from public, anon;
revoke select (thumbnail_file_name) on table public.posts from public, anon;

notify pgrst, 'reload schema';

commit;
