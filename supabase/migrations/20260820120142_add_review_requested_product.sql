begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

alter table public.reviews
  add column if not exists requested_product text;

comment on column public.reviews.requested_product is
  'Portfolio product category requested by an interview or testimonial client';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.reviews'::regclass
      and conname = 'reviews_requested_product_nonblank_check'
  ) then
    alter table public.reviews
      add constraint reviews_requested_product_nonblank_check
      check (
        requested_product is null
        or nullif(btrim(requested_product), '') is not null
      ) not valid;
  end if;
end;
$$;

alter table public.reviews
  validate constraint reviews_requested_product_nonblank_check;

-- The requested product is admin-only metadata. Existing anonymous column
-- grants remain intact; no anonymous grant is added for this column.
revoke select on table public.reviews from public, anon;
revoke select (requested_product) on table public.reviews from public, anon;

notify pgrst, 'reload schema';

commit;
