-- Run this once in the Supabase SQL Editor before deploying the application code.
-- reviews.company_name already stores the interview client (의뢰처), so this
-- script adds only the two missing project-information columns.
-- It is safe to run again: columns are retained and named checks are rebuilt.

begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

alter table public.reviews
  add column if not exists project_deliverable text,
  add column if not exists project_usage text;

comment on column public.reviews.project_deliverable is
  'Interview deliverable displayed as 제작물';
comment on column public.reviews.project_usage is
  'Interview project outcome or usage displayed as 활용';

-- Normalize values before adding nonblank checks.
update public.reviews
set project_deliverable = nullif(btrim(project_deliverable), ''),
    project_usage = nullif(btrim(project_usage), '')
where project_deliverable is not null
   or project_usage is not null;

-- Preserve the project information that legacy interview pages previously
-- supplied from local presentation data, then give other existing interviews
-- safe placeholders that an administrator can replace from the edit form.
update public.reviews
set project_deliverable = coalesce(
      project_deliverable,
      case slug
        when 'seojin-instech' then '카탈로그 · 브로슈어'
        when 'ninebell-healthcare' then '브로슈어 · 리플렛'
        when 'chungkang-college' then '게임 졸업 프로젝트 완료보고서'
        else '고객 인터뷰'
      end
    ),
    project_usage = coalesce(
      project_usage,
      case slug
        when 'seojin-instech' then '전시회 배포 · 영업 자료 활용'
        when 'ninebell-healthcare' then '제품 소개 · 고객 상담 자료 활용'
        when 'chungkang-college' then '졸업작품 전시회 배포 · 상용화 피드백 수집'
        else '고객 사례'
      end
    )
where kind = 'interview';

alter table public.reviews
  drop constraint if exists reviews_project_deliverable_nonblank_check,
  drop constraint if exists reviews_project_usage_nonblank_check,
  drop constraint if exists reviews_published_interview_project_info_check;

alter table public.reviews
  add constraint reviews_project_deliverable_nonblank_check
    check (
      project_deliverable is null
      or nullif(btrim(project_deliverable), '') is not null
    ),
  add constraint reviews_project_usage_nonblank_check
    check (
      project_usage is null
      or nullif(btrim(project_usage), '') is not null
    ),
  add constraint reviews_published_interview_project_info_check
    check (
      kind <> 'interview'
      or status <> 'published'
      or (
        nullif(btrim(project_deliverable), '') is not null
        and nullif(btrim(project_usage), '') is not null
      )
    );

commit;

-- Verification: expect two text columns, three named checks, and invalid_count 0.
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'reviews'
  and column_name in ('project_deliverable', 'project_usage')
order by column_name;

select constraint_row.conname,
       pg_get_constraintdef(constraint_row.oid) as definition
from pg_constraint as constraint_row
where constraint_row.conrelid = 'public.reviews'::regclass
  and constraint_row.conname in (
    'reviews_project_deliverable_nonblank_check',
    'reviews_project_usage_nonblank_check',
    'reviews_published_interview_project_info_check'
  )
order by constraint_row.conname;

select count(*) as invalid_count
from public.reviews
where kind = 'interview'
  and status = 'published'
  and (
    nullif(btrim(project_deliverable), '') is null
    or nullif(btrim(project_usage), '') is null
  );
