begin;

alter table public.reviews
  add column if not exists rating smallint;

comment on column public.reviews.rating is
  'Customer satisfaction score submitted with a testimonial, from 1 through 5.';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.reviews'::regclass
      and conname = 'reviews_rating_range_check'
  ) then
    alter table public.reviews
      add constraint reviews_rating_range_check
      check (
        rating is null
        or rating between 1 and 5
      ) not valid;
  end if;
end
$$;

alter table public.reviews
  validate constraint reviews_rating_range_check;

grant select (rating) on table public.reviews to anon;

commit;
