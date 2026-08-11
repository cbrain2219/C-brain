-- Reconcile the grouped product catalog with the two homepage pricing workbooks.
-- Safe to rerun: this preserves product IDs, statuses, sort order, and admin edits
-- outside the two corrections below.

begin;

do $$
declare
  leaflet_paper text;
  target_price_row_count integer;
  target_null_price_count integer;
begin
  if (select count(*) from public.products) <> 6
     or (
       select count(*)
       from public.products
       where product_type = any(array[
         '브로슈어 · 카탈로그',
         '리플렛 · 팜플렛',
         '포스터 · 전단지',
         '배너 · 족자 · 현수막',
         '명함 · 봉투',
         '로고'
       ]::text[])
     ) <> 6 then
    raise exception 'expected exactly six grouped products';
  end if;

  select configuration #>> array[
    'variants',
    '리플렛 · 팜플렛',
    'optionValues',
    'paper',
    '1'
  ]
  into leaflet_paper
  from public.products
  where product_type = '리플렛 · 팜플렛';

  if leaflet_paper is null
     or leaflet_paper not in ('고급지(량데뷰)', '고급지(랑데뷰)') then
    raise exception 'unexpected leaflet premium paper value: %', leaflet_paper;
  end if;

  select
    count(*),
    count(*) filter (where price_row.value -> 'unitPrice' = 'null'::jsonb)
  into target_price_row_count, target_null_price_count
  from public.products as product
  cross join lateral jsonb_each(product.configuration -> 'variants') as variant
  cross join lateral jsonb_each(
    variant.value -> 'priceRowsBySelection'
  ) as selection
  cross join lateral jsonb_array_elements(selection.value) as price_row
  where product.product_type = '배너 · 족자 · 현수막'
    and variant.key in ('배너', '족자', '현수막');

  if target_price_row_count not in (8, 24)
     or target_null_price_count not in (0, 16) then
    raise exception
      'unexpected banner/scroll/hanging price rows: total %, null %',
      target_price_row_count,
      target_null_price_count;
  end if;
end
$$;

update public.products
set configuration = jsonb_set(
  configuration,
  array[
    'variants',
    '리플렛 · 팜플렛',
    'optionValues',
    'paper',
    '1'
  ],
  to_jsonb('고급지(랑데뷰)'::text),
  false
)
where product_type = '리플렛 · 팜플렛';

with target as (
  select id, configuration
  from public.products
  where product_type = '배너 · 족자 · 현수막'
),
cleaned_variant as (
  select
    target.id,
    variant_name.name as variant_name,
    jsonb_object_agg(
      selection.key,
      complete_rows.rows
      order by selection.key
    ) as price_rows_by_selection
  from target
  cross join (
    values ('배너'::text), ('족자'::text), ('현수막'::text)
  ) as variant_name(name)
  cross join lateral jsonb_each(
    target.configuration #> array[
      'variants',
      variant_name.name,
      'priceRowsBySelection'
    ]
  ) as selection
  cross join lateral (
    select jsonb_agg(price_row.value order by price_row.ordinality) as rows
    from jsonb_array_elements(selection.value)
      with ordinality as price_row(value, ordinality)
    where price_row.value -> 'unitPrice' <> 'null'::jsonb
  ) as complete_rows
  group by target.id, variant_name.name
),
cleaned_product as (
  select
    id,
    jsonb_object_agg(
      variant_name,
      price_rows_by_selection
      order by variant_name
    ) as price_maps
  from cleaned_variant
  group by id
)
update public.products as product
set configuration = jsonb_set(
  jsonb_set(
    jsonb_set(
      product.configuration,
      array['variants', '배너', 'priceRowsBySelection'],
      cleaned.price_maps -> '배너',
      false
    ),
    array['variants', '족자', 'priceRowsBySelection'],
    cleaned.price_maps -> '족자',
    false
  ),
  array['variants', '현수막', 'priceRowsBySelection'],
  cleaned.price_maps -> '현수막',
  false
)
from cleaned_product as cleaned
where product.id = cleaned.id;

do $$
begin
  if exists (
    select 1
    from public.products as product
    cross join lateral jsonb_each(product.configuration -> 'variants') as variant
    cross join lateral jsonb_each(
      variant.value -> 'priceRowsBySelection'
    ) as selection
    cross join lateral jsonb_array_elements(selection.value) as price_row
    where price_row.value -> 'unitPrice' = 'null'::jsonb
  ) then
    raise exception 'a null unit price remains after workbook reconciliation';
  end if;

  if (
    select configuration #>> array[
      'variants',
      '리플렛 · 팜플렛',
      'optionValues',
      'paper',
      '1'
    ]
    from public.products
    where product_type = '리플렛 · 팜플렛'
  ) is distinct from '고급지(랑데뷰)' then
    raise exception 'leaflet premium paper correction failed';
  end if;
end
$$;

commit;

select
  count(*) as product_count,
  sum(variant_counts.price_selection_count) as price_selection_count,
  sum(variant_counts.price_row_count) as price_row_count,
  sum(variant_counts.service_selection_count) as service_selection_count
from public.products as product
cross join lateral (
  select
    sum((
      select count(*)
      from jsonb_object_keys(variant.value -> 'priceRowsBySelection')
    )) as price_selection_count,
    sum((
      select count(*)
      from jsonb_each(variant.value -> 'priceRowsBySelection') as selection
      cross join lateral jsonb_array_elements(selection.value)
    )) as price_row_count,
    sum((
      select count(*)
      from jsonb_object_keys(variant.value -> 'serviceEstimatesBySelection')
    )) as service_selection_count
  from jsonb_each(product.configuration -> 'variants') as variant
) as variant_counts
where product.product_type = any(array[
  '브로슈어 · 카탈로그',
  '리플렛 · 팜플렛',
  '포스터 · 전단지',
  '배너 · 족자 · 현수막',
  '명함 · 봉투',
  '로고'
]::text[]);

-- Expected result: 6 / 98 / 272 / 17.
