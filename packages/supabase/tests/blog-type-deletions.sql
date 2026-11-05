-- Run only in an isolated database after the blog-type-deletions migration.
-- All post fixtures and deletion records are rolled back.
begin;
set local request.jwt.claims = '{"role":"authenticated","app_metadata":{"role":"admin"}}';
set local role authenticated;

insert into public.posts (kind, slug, title, type, content, status, excerpt)
values
  ('blog', 'blog-type-published-fixture', '공개', '브로슈어·카탈로그', '본문', 'published', null),
  ('blog', 'blog-type-draft-fixture', '임시저장', 'SQL 임시 유형', '본문', 'draft', null),
  ('notice', 'blog-type-notice-fixture', '공지', 'SQL 공지 유형', '본문', 'published', '공지');

do $test$
begin
  if public.normalize_blog_type_key(' banner-book ') <> '배너 · 족자 · 현수막'
    or public.normalize_blog_type_key(' 브로슈어·카탈로그 ') <> '브로슈어 · 카탈로그'
    or public.normalize_blog_type_key(' Design  Tips ') <> 'design tips' then
    raise exception 'Category normalization changed';
  end if;
  if public.delete_blog_type('brochure-catalog') <> 'blocked_published' then
    raise exception 'Published type was not blocked';
  end if;
  if public.delete_blog_type('SQL 임시 유형') <> 'blocked_draft' then
    raise exception 'Draft-only type was not blocked';
  end if;
  if public.delete_blog_type('SQL 공지 유형') <> 'deleted' then
    raise exception 'Notice should not block a blog type';
  end if;
  if public.delete_blog_type('로고') <> 'deleted' then
    raise exception 'Unused default type was not deleted';
  end if;
  perform public.delete_blog_type('SQL 비공개 유형');
  perform public.delete_blog_type('LOGO');
  if not exists (select 1 from public.blog_type_deletions where type_key = 'logo') then
    raise exception 'Custom uppercase type was remapped to a product ID';
  end if;
  perform public.restore_blog_type('LOGO');
  if not exists (select 1 from public.blog_type_deletions where type_key = '로고') then
    raise exception 'Custom restoration also restored the default type';
  end if;
  begin
    insert into public.posts (kind, slug, title, type, content, status)
    values ('blog', 'blog-type-stale-fixture', '오래된 탭', '로고', '본문', 'draft');
    raise exception 'Deleted type was accepted by a stale editor';
  exception when check_violation then null;
  end;
  begin
    insert into public.blog_type_deletions values ('sql 임시 유형');
    raise exception 'Direct mutation bypassed the usage check';
  exception when check_violation then null;
  end;
end;
$test$;

reset role;
set local role anon;
do $test$
begin
  if not exists (select 1 from public.blog_type_deletions where type_key = '로고') then
    raise exception 'Public category exclusion is missing';
  end if;
  if exists (select 1 from public.blog_type_deletions where type_key = 'sql 비공개 유형') then
    raise exception 'Private custom type exposed to anonymous users';
  end if;
end;
$test$;

reset role;
set local request.jwt.claims = '{"role":"authenticated","app_metadata":{"role":"user"}}';
set local role authenticated;
do $test$
begin
  begin
    perform public.delete_blog_type('명함 · 봉투');
    raise exception 'Non-admin deleted a type';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.restore_blog_type('로고');
    raise exception 'Non-admin restored a type';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.blog_type_deletions values ('sql 권한 유형');
    raise exception 'Non-admin inserted a deletion';
  exception when insufficient_privilege then null;
  end;
end;
$test$;

reset role;
set local request.jwt.claims = '{"role":"authenticated","app_metadata":{"role":"admin"}}';
set local role authenticated;
select public.restore_blog_type('로고');
insert into public.posts (kind, slug, title, type, content, status)
values ('blog', 'blog-type-restored-fixture', '다시 추가', '로고', '본문', 'draft');
do $test$
begin
  if exists (select 1 from public.blog_type_deletions where type_key = '로고') then
    raise exception 'Explicit re-adding did not restore the type';
  end if;
  if public.delete_blog_type('로고') <> 'blocked_draft' then
    raise exception 'Re-used type became deletable';
  end if;
  if (select count(*) from public.posts where slug like 'blog-type-%-fixture') <> 4 then
    raise exception 'Type mutation changed post rows';
  end if;
end;
$test$;
rollback;
