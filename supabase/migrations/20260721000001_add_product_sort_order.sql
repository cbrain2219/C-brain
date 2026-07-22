create sequence public.products_sort_order_seq
  start with 0
  minvalue 0;

alter table public.products
  add column sort_order bigint;

with ordered_products as (
  select
    id,
    row_number() over (order by created_at desc, id desc) - 1 as sort_order
  from public.products
)
update public.products
set sort_order = ordered_products.sort_order
from ordered_products
where products.id = ordered_products.id;

select setval(
  'public.products_sort_order_seq',
  coalesce((select max(sort_order) from public.products), 0),
  exists (select 1 from public.products)
);

alter table public.products
  alter column sort_order set default nextval('public.products_sort_order_seq'),
  alter column sort_order set not null;

create index products_sort_order_idx on public.products (sort_order);

create function public.reorder_products(product_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null or not exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  ) then
    raise exception 'Admin access required.';
  end if;

  if product_ids is null
    or cardinality(product_ids) <> (select count(*) from public.products)
    or (
      select count(*) <> count(distinct product_id)
      from unnest(product_ids) as item(product_id)
    )
    or exists (
      select 1
      from public.products
      where not (id = any(product_ids))
    ) then
    raise exception 'Product order must include every product exactly once.';
  end if;

  update public.products as product
  set sort_order = ordered.sort_order
  from (
    select product_id, ordinality - 1 as sort_order
    from unnest(product_ids) with ordinality as item(product_id, ordinality)
  ) as ordered
  where product.id = ordered.product_id;
end;
$$;

revoke execute on function public.reorder_products(uuid[]) from public;
grant execute on function public.reorder_products(uuid[]) to authenticated;
