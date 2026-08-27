create table if not exists public.ebooks (
  id uuid primary key default gen_random_uuid(),
  embed_url text not null
    check (embed_url ~ '^https://[^[:space:]]+$'),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null
    check (nullif(btrim(title), '') is not null),
  seo_description text not null
    check (nullif(btrim(seo_description), '') is not null),
  status text not null default 'published'
    check (status in ('draft', 'published')),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists ebooks_status_created_at_idx
  on public.ebooks (status, created_at desc);

alter table public.ebooks enable row level security;

drop policy if exists "public select published ebooks" on public.ebooks;
create policy "public select published ebooks"
on public.ebooks
for select
to anon
using (status = 'published');

drop policy if exists "admins manage ebooks" on public.ebooks;
create policy "admins manage ebooks"
on public.ebooks
for all
to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

revoke all privileges on table public.ebooks
from public, anon, authenticated;

grant select (embed_url, seo_description, slug, status, title)
  on public.ebooks to anon;
grant select, insert, update, delete on public.ebooks to authenticated;
grant all privileges on public.ebooks to service_role;

notify pgrst, 'reload schema';
