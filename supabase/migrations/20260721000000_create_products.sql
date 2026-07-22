create type public.product_status as enum ('draft', 'published');

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  type text not null check (char_length(trim(type)) > 0),
  status public.product_status not null default 'draft',
  design_print_estimate integer not null check (design_print_estimate >= 0),
  planning_estimate integer not null check (planning_estimate >= 0),
  paper_types text[] not null check (cardinality(paper_types) > 0),
  page_counts integer[] not null check (cardinality(page_counts) > 0),
  order_quantities integer[] not null check (cardinality(order_quantities) > 0),
  unit_prices jsonb not null default '{}'::jsonb check (jsonb_typeof(unit_prices) = 'object'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index products_created_at_desc_idx on public.products (created_at desc);
create index products_status_idx on public.products (status);
create index products_type_idx on public.products (type);

create function public.set_products_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger products_set_updated_at
before update on public.products
for each row
execute function public.set_products_updated_at();

alter table public.products enable row level security;

create policy "admins select products"
on public.products
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "admins insert products"
on public.products
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "admins update products"
on public.products
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);
