-- Deletes only the payment test rows verified on 2026-08-10.
-- Keeps products, users, content, and the reusable payment_links row.
-- Run manually in the Supabase SQL editor.

begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

lock table public.orders, public.payments, public.refunds
in access exclusive mode;

do $$
begin
  if (select count(*) from public.orders) <> 1
    or (
      select count(*)
      from public.orders
      where id in (
        '300e925a-6f5f-4a0f-b017-155ac9ff4861'::uuid
      )
    ) <> 1
    or (select count(*) from public.payments) <> 1
    or (
      select count(*)
      from public.payments
      where id in (
        'cc72a21e-bd41-4ccc-92ee-dde99d918169'::uuid
      )
    ) <> 1
    or (select count(*) from public.refunds) <> 2
    or (
      select count(*)
      from public.refunds
      where id in (
        '6ac17e78-d2f2-4c36-a858-164fba8e54df'::uuid,
        'fc0536de-ca8c-4232-a739-e2f81857663d'::uuid
      )
    ) <> 2 then
    raise exception 'Payment test rows changed. Nothing was deleted.';
  end if;
end;
$$;

delete from public.refunds
where id in (
  '6ac17e78-d2f2-4c36-a858-164fba8e54df'::uuid,
  'fc0536de-ca8c-4232-a739-e2f81857663d'::uuid
);

delete from public.payments
where id in (
  'cc72a21e-bd41-4ccc-92ee-dde99d918169'::uuid
);

delete from public.orders
where id in (
  '300e925a-6f5f-4a0f-b017-155ac9ff4861'::uuid
);

do $$
begin
  if exists (select 1 from public.refunds)
    or exists (select 1 from public.payments)
    or exists (select 1 from public.orders) then
    raise exception 'Payment test cleanup was incomplete.';
  end if;
end;
$$;

commit;

select
  (select count(*) from public.orders) as orders,
  (select count(*) from public.payments) as payments,
  (select count(*) from public.refunds) as refunds,
  (select count(*) from public.payment_links) as payment_links;
