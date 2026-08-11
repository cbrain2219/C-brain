begin;

do $$
declare
  referencing_constraint text;
begin
  select constraint_row.conname
  into referencing_constraint
  from pg_constraint as constraint_row
  where constraint_row.contype = 'f'
    and constraint_row.confrelid = 'public.products'::regclass
  limit 1;

  if referencing_constraint is not null then
    raise exception
      'products is referenced by foreign key %, migrate references before grouping',
      referencing_constraint;
  end if;

  if (select count(*) from public.products) <> 10 then
    raise exception 'expected exactly ten source product variants';
  end if;

  if exists (
    select 1
    from public.products
    where product_type not in (
      '브로슈어 · 카탈로그',
      '리플렛 · 팜플렛',
      '포스터 · 전단지',
      '배너 · 족자 · 현수막',
      '명함 · 봉투',
      '로고'
    )
  ) then
    raise exception 'unsupported product type exists';
  end if;

  if exists (
    select 1
    from public.products
    where jsonb_typeof(configuration) is distinct from 'object'
  ) then
    raise exception 'product configuration must be a JSON object';
  end if;

  if exists (
    select 1
    from public.products
    group by product_type
    having count(distinct status) > 1
  ) then
    raise exception 'product variants have mixed statuses';
  end if;
end
$$;

create temporary table grouped_products on commit drop as
with source_rows as (
  select
    product.id,
    product.product_type,
    coalesce(nullif(btrim(product.product_subtype), ''), product.product_type)
      as variant_name,
    product.status,
    product.configuration,
    product.sort_order
  from public.products as product
),
aggregated as (
  select
    source.product_type,
    (array_agg(source.id order by source.sort_order, source.id))[1]
      as survivor_id,
    (array_agg(source.status order by source.sort_order, source.id))[1]
      as status,
    min(source.sort_order) as first_sort_order,
    jsonb_object_agg(
      source.variant_name,
      source.configuration
      order by source.sort_order, source.id
    ) as variants
  from source_rows as source
  group by source.product_type
)
select
  aggregated.product_type,
  aggregated.survivor_id,
  aggregated.status,
  row_number() over (
    order by aggregated.first_sort_order, aggregated.product_type
  )::bigint as next_sort_order,
  aggregated.variants
from aggregated;

do $$
begin
  if (select count(*) from grouped_products) <> 6 then
    raise exception 'expected exactly six grouped products';
  end if;

  if exists (
    with expected(product_type, variant_names) as (
      values
        ('브로슈어 · 카탈로그', array['브로슈어 · 카탈로그']::text[]),
        ('리플렛 · 팜플렛', array['리플렛 · 팜플렛']::text[]),
        ('포스터 · 전단지', array['포스터', '전단지']::text[]),
        ('배너 · 족자 · 현수막', array['배너', '족자', '현수막']::text[]),
        ('명함 · 봉투', array['명함', '봉투']::text[]),
        ('로고', array['로고']::text[])
    )
    select 1
    from expected
    left join grouped_products as grouped
      on grouped.product_type = expected.product_type
    where grouped.product_type is null
       or (
         select count(*)
         from jsonb_object_keys(grouped.variants)
       ) <> cardinality(expected.variant_names)
       or not (grouped.variants ?& expected.variant_names)
  ) then
    raise exception 'grouped product variants do not match the fixed catalog';
  end if;
end
$$;

update public.products as product
set
  configuration = jsonb_build_object('variants', grouped.variants),
  sort_order = grouped.next_sort_order,
  status = grouped.status
from grouped_products as grouped
where product.id = grouped.survivor_id;

delete from public.products as product
using grouped_products as grouped
where product.product_type = grouped.product_type
  and product.id <> grouped.survivor_id;

alter table public.products
  drop constraint if exists products_product_type_product_subtype_key;

alter table public.products
  drop column product_subtype;

alter table public.products
  add constraint products_product_type_key unique (product_type);

select setval(
  pg_get_serial_sequence('public.products', 'sort_order'),
  coalesce((select max(sort_order) from public.products), 0) + 1,
  false
);

do $$
begin
  if (select count(*) from public.products) <> 6
     or exists (
       select 1
       from public.products
       where jsonb_typeof(configuration -> 'variants') is distinct from 'object'
     ) then
    raise exception 'grouped product migration verification failed';
  end if;
end
$$;

commit;
