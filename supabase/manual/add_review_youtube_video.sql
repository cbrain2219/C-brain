-- Run this once in the Supabase SQL Editor before deploying the application code.
-- It is safe to run again: the column is retained and the known checks are rebuilt.

begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

alter table public.reviews
  add column if not exists youtube_video_id text;

comment on column public.reviews.youtube_video_id is
  'Validated 11-character YouTube video ID for interview playback';

alter table public.reviews
  drop constraint if exists reviews_check,
  drop constraint if exists reviews_youtube_video_id_format_check,
  drop constraint if exists reviews_video_source_check,
  drop constraint if exists reviews_published_interview_video_check;

alter table public.reviews
  add constraint reviews_youtube_video_id_format_check
    check (
      youtube_video_id is null
      or youtube_video_id ~ '^[A-Za-z0-9_-]{11}$'
    ),
  add constraint reviews_video_source_check
    check (
      nullif(btrim(video_path), '') is null
      or youtube_video_id is null
    ),
  add constraint reviews_published_interview_video_check
    check (
      kind <> 'interview'
      or status <> 'published'
      or (
        nullif(btrim(title), '') is not null
        and nullif(btrim(slug), '') is not null
        and (
          nullif(btrim(video_path), '') is not null
          or youtube_video_id is not null
        )
        and published_at is not null
      )
    );

commit;

-- Verification: expect one youtube_video_id row and all three named checks.
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'reviews'
  and column_name = 'youtube_video_id';

select constraint_row.conname,
       pg_get_constraintdef(constraint_row.oid) as definition
from pg_constraint as constraint_row
where constraint_row.conrelid = 'public.reviews'::regclass
  and constraint_row.conname in (
    'reviews_youtube_video_id_format_check',
    'reviews_video_source_check',
    'reviews_published_interview_video_check'
  )
order by constraint_row.conname;
