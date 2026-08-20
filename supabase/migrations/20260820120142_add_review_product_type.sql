begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

alter table public.reviews
  add column if not exists product_type text;

comment on column public.reviews.product_type is
  '인터뷰·후기 고객이 의뢰한 제품 유형';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.reviews'::regclass
      and conname = 'reviews_product_type_nonblank_check'
  ) then
    alter table public.reviews
      add constraint reviews_product_type_nonblank_check
      check (
        product_type is null
        or nullif(btrim(product_type), '') is not null
      ) not valid;
  end if;
end;
$$;

alter table public.reviews
  validate constraint reviews_product_type_nonblank_check;

-- The review product type is admin-only metadata. Existing anonymous column
-- grants remain intact; no anonymous grant is added for this column.
revoke select on table public.reviews from public, anon;
revoke select (product_type) on table public.reviews from public, anon;

notify pgrst, 'reload schema';

commit;
