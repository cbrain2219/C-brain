begin;

create function public.normalize_blog_type_key(value text)
returns text
language sql immutable strict security invoker
set search_path = ''
as $$
  select lower(case normalized
    when 'brochure-catalog' then '브로슈어 · 카탈로그'
    when 'leaflet-pamphlet' then '리플렛 · 팜플렛'
    when 'poster-flyer' then '포스터 · 전단지'
    when 'banner-display' then '배너 · 족자 · 현수막'
    when 'banner-book' then '배너 · 족자 · 현수막'
    when 'business-card-envelope' then '명함 · 봉투'
    when 'logo' then '로고'
    else normalized
  end)
  from (
    select regexp_replace(
      btrim(regexp_replace(value, '[[:space:]]*·[[:space:]]*', ' · ', 'g')),
      '[[:space:]]+', ' ', 'g'
    ) as normalized
  ) as input;
$$;

create table public.blog_type_deletions (
  type_key text primary key check (
    type_key <> '' and type_key <> '전체'
    and type_key = lower(regexp_replace(
      btrim(regexp_replace(type_key, '[[:space:]]*·[[:space:]]*', ' · ', 'g')),
      '[[:space:]]+', ' ', 'g'
    ))
  )
);

alter table public.blog_type_deletions enable row level security;
revoke all on public.blog_type_deletions from anon, authenticated;
grant select on public.blog_type_deletions to anon;
grant select, insert, delete on public.blog_type_deletions to authenticated;
grant all on public.blog_type_deletions to service_role;

-- Custom types without published posts are private; only default exclusions affect public tabs.
create policy blog_type_deletions_public_defaults
on public.blog_type_deletions for select to anon, authenticated
using (type_key in (
  '브로슈어 · 카탈로그', '리플렛 · 팜플렛', '포스터 · 전단지',
  '배너 · 족자 · 현수막', '명함 · 봉투', '로고'
));

create policy blog_type_deletions_admin_manage
on public.blog_type_deletions for all to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create function public.guard_blog_type_deletion()
returns trigger language plpgsql security invoker
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('blog-type:' || new.type_key, 0));
  if exists (
    select 1 from public.posts
    where kind = 'blog' and public.normalize_blog_type_key(type) = new.type_key
  ) then
    raise exception 'Blog type is in use.' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger blog_type_deletions_guard
before insert on public.blog_type_deletions
for each row execute function public.guard_blog_type_deletion();

create function public.guard_blog_post_type()
returns trigger language plpgsql security invoker
set search_path = ''
as $$
declare
  target_key text;
begin
  if new.kind = 'blog' then
    target_key := public.normalize_blog_type_key(new.type);
    perform pg_advisory_xact_lock(hashtextextended('blog-type:' || target_key, 0));
    if exists (select 1 from public.blog_type_deletions d where d.type_key = target_key) then
      raise exception 'Restore the deleted blog type before using it.' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create trigger posts_blog_type_guard
before insert or update of kind, type, status on public.posts
for each row execute function public.guard_blog_post_type();

create function public.delete_blog_type(target_type text)
returns text language plpgsql security invoker
set search_path = ''
as $$
declare
  target_key text := public.normalize_blog_type_key(target_type);
begin
  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'Admin access required.' using errcode = '42501';
  end if;
  if target_key is null or target_key in ('', '전체') then
    raise exception 'Invalid blog type.' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('blog-type:' || target_key, 0));
  if exists (
    select 1 from public.posts
    where kind = 'blog' and status = 'published'
      and public.normalize_blog_type_key(type) = target_key
  ) then
    return 'blocked_published';
  end if;
  if exists (
    select 1 from public.posts
    where kind = 'blog' and public.normalize_blog_type_key(type) = target_key
  ) then
    return 'blocked_draft';
  end if;
  insert into public.blog_type_deletions (type_key) values (target_key)
  on conflict do nothing;
  return 'deleted';
end;
$$;

create function public.restore_blog_type(target_type text)
returns void language plpgsql security invoker
set search_path = ''
as $$
declare
  target_key text := public.normalize_blog_type_key(target_type);
begin
  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'Admin access required.' using errcode = '42501';
  end if;
  if target_key is null or target_key in ('', '전체') then
    raise exception 'Invalid blog type.' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('blog-type:' || target_key, 0));
  delete from public.blog_type_deletions where type_key = target_key;
end;
$$;

revoke all on function public.normalize_blog_type_key(text) from public;
revoke all on function public.guard_blog_type_deletion() from public;
revoke all on function public.guard_blog_post_type() from public;
revoke all on function public.delete_blog_type(text) from public;
revoke all on function public.restore_blog_type(text) from public;
grant execute on function public.normalize_blog_type_key(text) to authenticated, service_role;
grant execute on function public.delete_blog_type(text) to authenticated;
grant execute on function public.restore_blog_type(text) to authenticated;

commit;
