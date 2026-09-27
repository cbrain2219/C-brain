-- Run only in an isolated test database after the content-summary migration.
-- All fixtures and the additional RLS policy are rolled back.
begin;
insert into public.posts (kind, slug, title, type, content, status)
values
  ('blog', 'cache-sql-public-fixture', '공개', '인쇄 실무팁', '<style>a</style><p>첫째</p><style>b</style><p>둘째 &amp; 설명</p>', 'published'),
  ('blog', 'cache-sql-draft-fixture', '비공개', '인쇄 실무팁', '비공개 본문', 'draft'),
  ('blog', 'cache-sql-rls-fixture', 'RLS 제한', '인쇄 실무팁', '접근 금지', 'published');
create policy cache_sql_restriction on public.posts as restrictive
  for select to anon using (slug <> 'cache-sql-rls-fixture');
set local role anon;
do $test$
begin
  if (select content_preview from public.published_post_summaries where slug='cache-sql-public-fixture')
    is distinct from '첫째 둘째 & 설명' then
    raise exception 'Summary text differs from the existing article text';
  end if;
  if exists (select 1 from public.published_post_summaries where slug in ('cache-sql-draft-fixture','cache-sql-rls-fixture')) then
    raise exception 'Summary view bypassed publication status or row-level security';
  end if;
  if exists (select 1 from public.published_post_summaries p where to_jsonb(p) ? 'content') then
    raise exception 'Summary view exposes full article content';
  end if;
  if public.public_content_plain_text(E'## 제목\n\n**강조**와 [링크](https://example.com)\n\n- 목록', 'markdown', true)
    is distinct from E'제목\n\n강조와 링크\n\n목록' then
    raise exception 'Portfolio markdown description changed';
  end if;
end;
$test$;
rollback;
