begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

create extension if not exists pgcrypto;

-- The published migration and fresh baseline use the same content concepts
-- but different column names. Rename only the documented legacy columns so
-- existing values, defaults, indexes, and dependent expressions move intact.
-- A hybrid table is ambiguous and must be resolved explicitly, not guessed.
do $$
declare
  column_pair record;
  legacy_column_exists boolean;
  canonical_column_exists boolean;
begin
  for column_pair in
    select *
    from (
      values
        ('posts', 'is_landing_enabled', 'show_on_landing'),
        ('posts', 'is_banner_enabled', 'show_as_banner'),
        ('posts', 'is_featured_enabled', 'featured'),
        ('posts', 'is_pinned', 'pinned'),
        ('portfolio_items', 'is_landing_enabled', 'show_on_landing'),
        ('portfolio_items', 'is_pinned', 'pinned'),
        ('reviews', 'company', 'company_name'),
        ('reviews', 'manager', 'manager_name'),
        ('reviews', 'is_landing_enabled', 'show_on_landing')
    ) as pairs(table_name, legacy_column_name, canonical_column_name)
  loop
    select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = column_pair.table_name
        and column_name = column_pair.legacy_column_name
    )
    into legacy_column_exists;

    select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = column_pair.table_name
        and column_name = column_pair.canonical_column_name
    )
    into canonical_column_exists;

    if legacy_column_exists and canonical_column_exists then
      raise exception
        'cannot converge public.%: both legacy column % and canonical column % exist',
        column_pair.table_name,
        column_pair.legacy_column_name,
        column_pair.canonical_column_name;
    end if;

    if legacy_column_exists then
      execute format(
        'alter table public.%I rename column %I to %I',
        column_pair.table_name,
        column_pair.legacy_column_name,
        column_pair.canonical_column_name
      );
    end if;
  end loop;
end;
$$;

-- These columns were introduced by manual follow-up SQL in the current
-- history. They are nullable so legacy published interviews remain valid;
-- current admin validation enforces their requirements for new publication.
-- Do not add reviews_published_interview_project_info_check or
-- reviews_published_interview_video_check here, even NOT VALID: while that
-- skips the initial table scan, it still rejects every later UPDATE of a
-- legacy published interview that lacks the newly introduced values.
alter table public.reviews
  add column if not exists project_deliverable text,
  add column if not exists project_usage text,
  add column if not exists youtube_video_id text;

-- These basic checks are safe for both histories: the legacy columns above
-- start as null, and the current baseline/manual migrations already carry
-- these named constraints. Do not replace an existing constraint here.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.reviews'::regclass
      and conname = 'reviews_youtube_video_id_format_check'
  ) then
    alter table public.reviews
      add constraint reviews_youtube_video_id_format_check
      check (
        youtube_video_id is null
        or youtube_video_id ~ '^[A-Za-z0-9_-]{11}$'
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.reviews'::regclass
      and conname = 'reviews_video_source_check'
  ) then
    alter table public.reviews
      add constraint reviews_video_source_check
      check (
        nullif(btrim(video_path), '') is null
        or youtube_video_id is null
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.reviews'::regclass
      and conname = 'reviews_project_deliverable_nonblank_check'
  ) then
    alter table public.reviews
      add constraint reviews_project_deliverable_nonblank_check
      check (
        project_deliverable is null
        or nullif(btrim(project_deliverable), '') is not null
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.reviews'::regclass
      and conname = 'reviews_project_usage_nonblank_check'
  ) then
    alter table public.reviews
      add constraint reviews_project_usage_nonblank_check
      check (
        project_usage is null
        or nullif(btrim(project_usage), '') is not null
      );
  end if;
end;
$$;

-- The published admin-content migration used an enum with the legacy `text`
-- label. Fresh installs already use text plus this check constraint. Convert
-- only the mode label while changing all three columns to their shared type;
-- `content` is deliberately never selected, transformed, or written here.
alter table public.posts drop constraint if exists posts_content_mode_check;
alter table public.posts alter column content_mode drop default;
alter table public.posts alter column content_mode type text
  using case
    when content_mode::text = 'text' then 'markdown'
    else content_mode::text
  end;
alter table public.posts alter column content_mode set default 'html';
alter table public.posts add constraint posts_content_mode_check
  check (content_mode in ('html', 'markdown'));

alter table public.portfolio_items drop constraint if exists portfolio_items_content_mode_check;
alter table public.portfolio_items alter column content_mode drop default;
alter table public.portfolio_items alter column content_mode type text
  using case
    when content_mode::text = 'text' then 'markdown'
    else content_mode::text
  end;
alter table public.portfolio_items alter column content_mode set default 'html';
alter table public.portfolio_items add constraint portfolio_items_content_mode_check
  check (content_mode in ('html', 'markdown'));

alter table public.reviews drop constraint if exists reviews_content_mode_check;
alter table public.reviews alter column content_mode drop default;
alter table public.reviews alter column content_mode type text
  using case
    when content_mode::text = 'text' then 'markdown'
    else content_mode::text
  end;
alter table public.reviews alter column content_mode set default 'html';
alter table public.reviews add constraint reviews_content_mode_check
  check (content_mode in ('html', 'markdown'));

alter table public.posts
  add column if not exists content_authoring_mode text,
  add column if not exists content_json jsonb,
  add column if not exists content_schema_version integer,
  add column if not exists content_source_backup text,
  add column if not exists content_asset_scope uuid;

do $$
declare
  updated_at_trigger_state "char";
begin
  select tgenabled
  into updated_at_trigger_state
  from pg_trigger
  where tgrelid = 'public.posts'::regclass
    and tgname = 'posts_set_updated_at'
    and not tgisinternal;

  if updated_at_trigger_state in ('O', 'A', 'R') then
    alter table public.posts disable trigger posts_set_updated_at;
  end if;

  update public.posts
  set
    content_authoring_mode = 'raw_html',
    content_schema_version = 1,
    content_asset_scope = gen_random_uuid();

  case updated_at_trigger_state
    when 'O' then alter table public.posts enable trigger posts_set_updated_at;
    when 'A' then alter table public.posts enable always trigger posts_set_updated_at;
    when 'R' then alter table public.posts enable replica trigger posts_set_updated_at;
    else null;
  end case;
end;
$$;

alter table public.posts
  alter column content_authoring_mode set default 'raw_html',
  alter column content_authoring_mode set not null,
  alter column content_schema_version set default 1,
  alter column content_schema_version set not null,
  alter column content_asset_scope set default gen_random_uuid(),
  alter column content_asset_scope set not null,
  drop constraint if exists posts_content_authoring_mode_check,
  drop constraint if exists posts_content_schema_version_check,
  drop constraint if exists posts_wysiwyg_content_document_check,
  add constraint posts_content_authoring_mode_check
    check (content_authoring_mode in ('raw_html', 'wysiwyg')),
  add constraint posts_content_schema_version_check
    check (content_schema_version = 1),
  add constraint posts_wysiwyg_content_document_check
    check (
      content_authoring_mode <> 'wysiwyg'
      or (
        content_mode = 'html'
        and content_json is not null
        and jsonb_typeof(content_json) = 'object'
        and coalesce(content_json ->> 'type' = 'doc', false)
      )
    );

alter table public.portfolio_items
  add column if not exists content_authoring_mode text,
  add column if not exists content_json jsonb,
  add column if not exists content_schema_version integer,
  add column if not exists content_source_backup text,
  add column if not exists content_asset_scope uuid;

do $$
declare
  updated_at_trigger_state "char";
begin
  select tgenabled
  into updated_at_trigger_state
  from pg_trigger
  where tgrelid = 'public.portfolio_items'::regclass
    and tgname = 'portfolio_items_set_updated_at'
    and not tgisinternal;

  if updated_at_trigger_state in ('O', 'A', 'R') then
    alter table public.portfolio_items disable trigger portfolio_items_set_updated_at;
  end if;

  update public.portfolio_items
  set
    content_authoring_mode = 'raw_html',
    content_schema_version = 1,
    content_asset_scope = gen_random_uuid();

  case updated_at_trigger_state
    when 'O' then alter table public.portfolio_items enable trigger portfolio_items_set_updated_at;
    when 'A' then alter table public.portfolio_items enable always trigger portfolio_items_set_updated_at;
    when 'R' then alter table public.portfolio_items enable replica trigger portfolio_items_set_updated_at;
    else null;
  end case;
end;
$$;

alter table public.portfolio_items
  alter column content_authoring_mode set default 'raw_html',
  alter column content_authoring_mode set not null,
  alter column content_schema_version set default 1,
  alter column content_schema_version set not null,
  alter column content_asset_scope set default gen_random_uuid(),
  alter column content_asset_scope set not null,
  drop constraint if exists portfolio_items_content_authoring_mode_check,
  drop constraint if exists portfolio_items_content_schema_version_check,
  drop constraint if exists portfolio_items_wysiwyg_content_document_check,
  add constraint portfolio_items_content_authoring_mode_check
    check (content_authoring_mode in ('raw_html', 'wysiwyg')),
  add constraint portfolio_items_content_schema_version_check
    check (content_schema_version = 1),
  add constraint portfolio_items_wysiwyg_content_document_check
    check (
      content_authoring_mode <> 'wysiwyg'
      or (
        content_mode = 'html'
        and content_json is not null
        and jsonb_typeof(content_json) = 'object'
        and coalesce(content_json ->> 'type' = 'doc', false)
      )
    );

alter table public.reviews
  add column if not exists content_authoring_mode text,
  add column if not exists content_json jsonb,
  add column if not exists content_schema_version integer,
  add column if not exists content_source_backup text,
  add column if not exists content_asset_scope uuid;

do $$
declare
  updated_at_trigger_state "char";
begin
  select tgenabled
  into updated_at_trigger_state
  from pg_trigger
  where tgrelid = 'public.reviews'::regclass
    and tgname = 'reviews_set_updated_at'
    and not tgisinternal;

  if updated_at_trigger_state in ('O', 'A', 'R') then
    alter table public.reviews disable trigger reviews_set_updated_at;
  end if;

  update public.reviews
  set
    content_authoring_mode = 'raw_html',
    content_schema_version = 1,
    content_asset_scope = gen_random_uuid();

  case updated_at_trigger_state
    when 'O' then alter table public.reviews enable trigger reviews_set_updated_at;
    when 'A' then alter table public.reviews enable always trigger reviews_set_updated_at;
    when 'R' then alter table public.reviews enable replica trigger reviews_set_updated_at;
    else null;
  end case;
end;
$$;

alter table public.reviews
  alter column content_authoring_mode set default 'raw_html',
  alter column content_authoring_mode set not null,
  alter column content_schema_version set default 1,
  alter column content_schema_version set not null,
  alter column content_asset_scope set default gen_random_uuid(),
  alter column content_asset_scope set not null,
  drop constraint if exists reviews_content_authoring_mode_check,
  drop constraint if exists reviews_content_schema_version_check,
  drop constraint if exists reviews_wysiwyg_content_document_check,
  add constraint reviews_content_authoring_mode_check
    check (content_authoring_mode in ('raw_html', 'wysiwyg')),
  add constraint reviews_content_schema_version_check
    check (content_schema_version = 1),
  add constraint reviews_wysiwyg_content_document_check
    check (
      content_authoring_mode <> 'wysiwyg'
      or (
        content_mode = 'html'
        and content_json is not null
        and jsonb_typeof(content_json) = 'object'
        and coalesce(content_json ->> 'type' = 'doc', false)
      )
    );

-- Each record owns a stable storage scope. Editors may include the current
-- scope in ordinary update payloads, but cannot rotate it after insertion.
create or replace function public.prevent_content_asset_scope_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.content_asset_scope is distinct from old.content_asset_scope then
    raise exception 'content_asset_scope is immutable';
  end if;

  return new;
end;
$$;

revoke execute on function public.prevent_content_asset_scope_change()
from public, anon, authenticated;

drop trigger if exists posts_prevent_content_asset_scope_change on public.posts;
create trigger posts_prevent_content_asset_scope_change
before update of content_asset_scope on public.posts
for each row
execute function public.prevent_content_asset_scope_change();

drop trigger if exists portfolio_items_prevent_content_asset_scope_change
on public.portfolio_items;
create trigger portfolio_items_prevent_content_asset_scope_change
before update of content_asset_scope on public.portfolio_items
for each row
execute function public.prevent_content_asset_scope_change();

drop trigger if exists reviews_prevent_content_asset_scope_change on public.reviews;
create trigger reviews_prevent_content_asset_scope_change
before update of content_asset_scope on public.reviews
for each row
execute function public.prevent_content_asset_scope_change();

-- Public rendering must not reveal editable source or inactive authoring state.
-- Revoke both direct and inherited table privileges before granting the exact
-- published-content projection. Authenticated admin and service clients retain
-- their full table rights; RLS still limits authenticated rows to administrators.
revoke all privileges on table public.posts, public.portfolio_items, public.reviews
from public, anon;

-- Historical tables retain unrelated columns, so build each grant from the
-- columns actually present while excluding only inactive editable source and
-- schema metadata.
do $$
declare
  content_table text;
  public_columns text;
begin
  foreach content_table in array array['posts', 'portfolio_items', 'reviews']
  loop
    select string_agg(format('%I', column_name), ', ' order by ordinal_position)
    into public_columns
    from information_schema.columns
    where table_schema = 'public'
      and table_name = content_table
      and column_name not in (
        'content_json',
        'content_source_backup',
        'content_schema_version'
      );

    if public_columns is null then
      raise exception 'expected public.% content table to have columns', content_table;
    end if;

    execute format(
      'grant select (%s) on table public.%I to anon',
      public_columns,
      content_table
    );
  end loop;
end
$$;

grant select, insert, update, delete
on public.posts, public.portfolio_items, public.reviews
to authenticated;

grant all privileges on table public.posts, public.portfolio_items, public.reviews
to service_role;

drop policy if exists posts_public_read_published on public.posts;
drop policy if exists "public select published posts" on public.posts;
create policy posts_public_read_published
on public.posts
for select
to anon
using (status = 'published');

drop policy if exists portfolio_items_public_read_published on public.portfolio_items;
drop policy if exists "public select published portfolio items" on public.portfolio_items;
create policy portfolio_items_public_read_published
on public.portfolio_items
for select
to anon
using (status = 'published');

drop policy if exists reviews_public_read_published on public.reviews;
drop policy if exists "public select published reviews" on public.reviews;
create policy reviews_public_read_published
on public.reviews
for select
to anon
using (status = 'published');

commit;
