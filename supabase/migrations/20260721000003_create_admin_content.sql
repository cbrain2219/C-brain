do $$
begin
  create type public.publish_status as enum ('draft', 'published', 'archived');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.post_kind as enum ('blog', 'notice');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.content_mode as enum ('html', 'text');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.review_kind as enum ('interview', 'testimonial');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.inquiry_status as enum ('received', 'processing', 'resolved');
exception
  when duplicate_object then null;
end
$$;

create sequence if not exists public.posts_sort_order_seq
  start with 0
  minvalue 0;

create sequence if not exists public.portfolio_items_sort_order_seq
  start with 0
  minvalue 0;

create sequence if not exists public.reviews_sort_order_seq
  start with 0
  minvalue 0;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  kind public.post_kind not null default 'blog',
  type text not null check (char_length(trim(type)) > 0),
  title text not null check (char_length(trim(title)) > 0),
  slug text not null check (char_length(trim(slug)) > 0),
  content text not null,
  content_mode public.content_mode not null default 'html',
  excerpt text,
  thumbnail_path text,
  thumbnail_alt text,
  status public.publish_status not null default 'draft',
  published_at timestamptz,
  seo jsonb,
  seo_description text,
  is_landing_enabled boolean not null default false,
  is_banner_enabled boolean not null default false,
  is_featured_enabled boolean not null default false,
  is_pinned boolean not null default false,
  view_count bigint not null default 0 check (view_count >= 0),
  sort_order bigint not null default nextval('public.posts_sort_order_seq'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (kind, slug)
);

create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  type text not null check (char_length(trim(type)) > 0),
  title text not null check (char_length(trim(title)) > 0),
  slug text not null unique check (char_length(trim(slug)) > 0),
  client_name text,
  summary text,
  content text not null,
  content_mode public.content_mode not null default 'html',
  images jsonb not null default '[]'::jsonb check (jsonb_typeof(images) = 'array'),
  image_path text,
  is_landing_enabled boolean not null default false,
  is_pinned boolean not null default false,
  status public.publish_status not null default 'draft',
  published_at timestamptz,
  seo jsonb,
  seo_description text,
  view_count bigint not null default 0 check (view_count >= 0),
  sort_order bigint not null default nextval('public.portfolio_items_sort_order_seq'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  kind public.review_kind not null,
  company text not null,
  manager text,
  title text,
  slug text,
  content text not null,
  content_mode public.content_mode not null default 'html',
  video_path text,
  video_alt text,
  seo_description text,
  is_landing_enabled boolean not null default false,
  status public.publish_status not null default 'draft',
  published_at timestamptz,
  view_count bigint not null default 0 check (view_count >= 0),
  sort_order bigint not null default nextval('public.reviews_sort_order_seq'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint reviews_published_company_check
    check (status <> 'published' or char_length(trim(company)) > 0)
);

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  name text not null check (char_length(trim(name)) > 0),
  email text not null check (char_length(trim(email)) > 0),
  phone text not null check (char_length(trim(phone)) > 0),
  service text not null check (char_length(trim(service)) > 0),
  complaint_type text not null check (char_length(trim(complaint_type)) > 0),
  content text not null check (char_length(trim(content)) > 0),
  phone_verified boolean not null default false,
  privacy_agreed_at timestamptz not null,
  status public.inquiry_status not null default 'received',
  company text,
  budget text,
  title text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.inquiry_attachments (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries (id) on delete cascade,
  bucket text not null default 'private-attachments'
    check (bucket = 'private-attachments'),
  path text not null check (char_length(trim(path)) > 0),
  file_name text not null check (char_length(trim(file_name)) > 0),
  file_size bigint not null check (file_size >= 0),
  content_type text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (bucket, path)
);

create index if not exists posts_kind_sort_order_idx
  on public.posts (kind, sort_order, id);
create index if not exists posts_kind_status_sort_order_idx
  on public.posts (kind, status, sort_order, id);

create index if not exists portfolio_items_sort_order_idx
  on public.portfolio_items (sort_order, id);
create index if not exists portfolio_items_status_sort_order_idx
  on public.portfolio_items (status, sort_order, id);

create unique index if not exists reviews_slug_idx
  on public.reviews (slug)
  where slug is not null;
create index if not exists reviews_sort_order_idx
  on public.reviews (sort_order, id);
create index if not exists reviews_kind_status_sort_order_idx
  on public.reviews (kind, status, sort_order, id);

create index if not exists inquiries_status_created_at_idx
  on public.inquiries (status, created_at desc);
create index if not exists inquiry_attachments_inquiry_id_idx
  on public.inquiry_attachments (inquiry_id);

select setval(
  'public.posts_sort_order_seq',
  coalesce((select max(sort_order) from public.posts), 0),
  exists (select 1 from public.posts)
);

select setval(
  'public.portfolio_items_sort_order_seq',
  coalesce((select max(sort_order) from public.portfolio_items), 0),
  exists (select 1 from public.portfolio_items)
);

select setval(
  'public.reviews_sort_order_seq',
  coalesce((select max(sort_order) from public.reviews), 0),
  exists (select 1 from public.reviews)
);

create or replace function public.set_content_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
before update on public.posts
for each row
execute function public.set_content_updated_at();

drop trigger if exists portfolio_items_set_updated_at on public.portfolio_items;
create trigger portfolio_items_set_updated_at
before update on public.portfolio_items
for each row
execute function public.set_content_updated_at();

drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at
before update on public.reviews
for each row
execute function public.set_content_updated_at();

drop trigger if exists inquiries_set_updated_at on public.inquiries;
create trigger inquiries_set_updated_at
before update on public.inquiries
for each row
execute function public.set_content_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.reorder_posts(
  post_kind public.post_kind,
  post_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required.';
  end if;

  lock table public.posts in share row exclusive mode;

  if post_ids is null
    or cardinality(post_ids) <> (
      select count(*)
      from public.posts as post
      where post.kind = $1
    )
    or (
      select count(*) <> count(distinct post_id)
      from unnest(post_ids) as item(post_id)
    )
    or exists (
      select 1
      from public.posts as post
      where post.kind = $1
        and not (post.id = any(post_ids))
    ) then
    raise exception 'Post order must include every post of the requested kind exactly once.';
  end if;

  update public.posts as post
  set sort_order = ordered.sort_order
  from (
    select post_id, ordinality - 1 as sort_order
    from unnest(post_ids) with ordinality as item(post_id, ordinality)
  ) as ordered
  where post.kind = $1
    and post.id = ordered.post_id;
end;
$$;

create or replace function public.reorder_portfolio_items(
  portfolio_item_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required.';
  end if;

  lock table public.portfolio_items in share row exclusive mode;

  if portfolio_item_ids is null
    or cardinality(portfolio_item_ids) <> (
      select count(*)
      from public.portfolio_items
    )
    or (
      select count(*) <> count(distinct portfolio_item_id)
      from unnest(portfolio_item_ids) as item(portfolio_item_id)
    )
    or exists (
      select 1
      from public.portfolio_items as item
      where not (item.id = any(portfolio_item_ids))
    ) then
    raise exception 'Portfolio order must include every portfolio item exactly once.';
  end if;

  update public.portfolio_items as item
  set sort_order = ordered.sort_order
  from (
    select portfolio_item_id, ordinality - 1 as sort_order
    from unnest(portfolio_item_ids) with ordinality as entry(portfolio_item_id, ordinality)
  ) as ordered
  where item.id = ordered.portfolio_item_id;
end;
$$;

create or replace function public.reorder_reviews(review_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required.';
  end if;

  lock table public.reviews in share row exclusive mode;

  if review_ids is null
    or cardinality(review_ids) <> (select count(*) from public.reviews)
    or (
      select count(*) <> count(distinct review_id)
      from unnest(review_ids) as item(review_id)
    )
    or exists (
      select 1
      from public.reviews as review
      where not (review.id = any(review_ids))
    ) then
    raise exception 'Review order must include every review exactly once.';
  end if;

  update public.reviews as review
  set sort_order = ordered.sort_order
  from (
    select review_id, ordinality - 1 as sort_order
    from unnest(review_ids) with ordinality as item(review_id, ordinality)
  ) as ordered
  where review.id = ordered.review_id;
end;
$$;

revoke execute on function public.reorder_posts(public.post_kind, uuid[]) from public;
revoke execute on function public.reorder_portfolio_items(uuid[]) from public;
revoke execute on function public.reorder_reviews(uuid[]) from public;
grant execute on function public.reorder_posts(public.post_kind, uuid[]) to authenticated;
grant execute on function public.reorder_portfolio_items(uuid[]) to authenticated;
grant execute on function public.reorder_reviews(uuid[]) to authenticated;

alter table public.posts enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.reviews enable row level security;
alter table public.inquiries enable row level security;
alter table public.inquiry_attachments enable row level security;

drop policy if exists "public select published products" on public.products;
create policy "public select published products"
on public.products
for select
to anon
using (status = 'published');

drop policy if exists "public select published posts" on public.posts;
create policy "public select published posts"
on public.posts
for select
to anon, authenticated
using (status = 'published');

drop policy if exists "admins manage posts" on public.posts;
create policy "admins manage posts"
on public.posts
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "public select published portfolio items" on public.portfolio_items;
create policy "public select published portfolio items"
on public.portfolio_items
for select
to anon, authenticated
using (status = 'published');

drop policy if exists "admins manage portfolio items" on public.portfolio_items;
create policy "admins manage portfolio items"
on public.portfolio_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "public select published reviews" on public.reviews;
create policy "public select published reviews"
on public.reviews
for select
to anon, authenticated
using (status = 'published');

drop policy if exists "admins manage reviews" on public.reviews;
create policy "admins manage reviews"
on public.reviews
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admins manage inquiries" on public.inquiries;
drop policy if exists "admins select inquiries" on public.inquiries;
create policy "admins select inquiries"
on public.inquiries
for select
to authenticated
using (public.is_admin());

drop policy if exists "admins update inquiries" on public.inquiries;
create policy "admins update inquiries"
on public.inquiries
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admins manage inquiry attachments" on public.inquiry_attachments;
drop policy if exists "admins select inquiry attachments" on public.inquiry_attachments;
create policy "admins select inquiry attachments"
on public.inquiry_attachments
for select
to authenticated
using (public.is_admin());

revoke select on public.products from anon;
grant select (id, name, status, type, unit_prices, sort_order)
  on public.products to anon;
grant select on public.products to authenticated;
grant select on public.posts, public.portfolio_items, public.reviews
  to anon, authenticated;
grant insert, update, delete on public.posts, public.portfolio_items, public.reviews
  to authenticated;
grant select on public.inquiries, public.inquiry_attachments to authenticated;
grant update on public.inquiries to authenticated;
revoke insert, delete on public.inquiries, public.inquiry_attachments from authenticated;
revoke update on public.inquiry_attachments from authenticated;
grant usage, select on sequence public.posts_sort_order_seq,
  public.portfolio_items_sort_order_seq,
  public.reviews_sort_order_seq
  to authenticated;
grant all on public.posts, public.portfolio_items, public.reviews,
  public.inquiries, public.inquiry_attachments
  to service_role;
grant usage, select on sequence public.posts_sort_order_seq,
  public.portfolio_items_sort_order_seq,
  public.reviews_sort_order_seq
  to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'public-assets',
    'public-assets',
    true,
    524288000,
    array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']
  ),
  (
    'private-attachments',
    'private-attachments',
    false,
    52428800,
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read public assets" on storage.objects;

drop policy if exists "admins insert public assets" on storage.objects;
create policy "admins insert public assets"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'public-assets' and public.is_admin());

drop policy if exists "admins update public assets" on storage.objects;
create policy "admins update public assets"
on storage.objects
for update
to authenticated
using (bucket_id = 'public-assets' and public.is_admin())
with check (bucket_id = 'public-assets' and public.is_admin());

drop policy if exists "admins delete public assets" on storage.objects;
create policy "admins delete public assets"
on storage.objects
for delete
to authenticated
using (bucket_id = 'public-assets' and public.is_admin());

drop policy if exists "admins read private attachments" on storage.objects;
create policy "admins read private attachments"
on storage.objects
for select
to authenticated
using (bucket_id = 'private-attachments' and public.is_admin());

drop policy if exists "admins insert private attachments" on storage.objects;
drop policy if exists "admins update private attachments" on storage.objects;
drop policy if exists "admins delete private attachments" on storage.objects;
