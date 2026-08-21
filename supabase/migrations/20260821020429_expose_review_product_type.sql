begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

-- Product type is rendered on published review cards. Row visibility remains
-- limited by the existing reviews_public_read_published RLS policy.
grant select (product_type) on table public.reviews to anon;

notify pgrst, 'reload schema';

commit;
