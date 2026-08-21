begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

alter table public.orders
add column order_number text;

create unique index orders_order_number_idx
on public.orders (order_number);

create function public.generate_order_number()
returns text
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_attempt integer;
  v_order_number text;
begin
  -- Serialize allocation until the surrounding insert/update commits so a
  -- concurrent checkout cannot select the same candidate before it is stored.
  perform pg_advisory_xact_lock(20260821, 1);

  for v_attempt in 1..100 loop
    v_order_number := floor(10000000 + random() * 90000000)::bigint::text;

    if not exists (
      select 1
      from public.orders as checkout_order
      where checkout_order.order_number = v_order_number
    ) then
      return v_order_number;
    end if;
  end loop;

  raise exception 'Unable to allocate a unique eight-digit order number.'
    using errcode = '54000';
end;
$$;

revoke execute on function public.generate_order_number()
  from public, anon, authenticated;
grant execute on function public.generate_order_number()
  to service_role;

alter table public.orders
alter column order_number set default public.generate_order_number();

do $$
declare
  v_order_id uuid;
begin
  for v_order_id in
    select checkout_order.id
    from public.orders as checkout_order
    where checkout_order.order_number is null
    order by checkout_order.created_at, checkout_order.id
  loop
    update public.orders
    set order_number = public.generate_order_number()
    where id = v_order_id;
  end loop;
end;
$$;

alter table public.orders
add constraint orders_order_number_format_check
  check (order_number ~ '^[0-9]{8}$'),
add constraint orders_order_number_key
  unique using index orders_order_number_idx;

alter table public.orders
alter column order_number set not null;

comment on column public.orders.order_number is
  'Unique eight-digit human-facing order number; not an authentication secret.';

do $$
begin
  if exists (
    select 1
    from public.orders as checkout_order
    where checkout_order.order_number !~ '^[0-9]{8}$'
  ) then
    raise exception 'Order-number backfill validation failed.';
  end if;
end;
$$;

commit;
