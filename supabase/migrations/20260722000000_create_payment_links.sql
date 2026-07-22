create type public.payment_link_status as enum ('pending', 'paid');

create table public.payment_links (
  id uuid primary key default gen_random_uuid(),
  public_token uuid not null unique default gen_random_uuid(),
  client_name text not null check (char_length(trim(client_name)) > 0),
  payment_name text not null check (char_length(trim(payment_name)) > 0),
  amount bigint not null check (amount between 1 and 999999999999),
  status public.payment_link_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index payment_links_created_at_desc_idx
on public.payment_links (created_at desc);

create index payment_links_client_name_idx
on public.payment_links (client_name);

create index payment_links_status_idx
on public.payment_links (status);

create function public.set_payment_links_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger payment_links_set_updated_at
before update on public.payment_links
for each row
execute function public.set_payment_links_updated_at();

alter table public.payment_links enable row level security;

create policy "admins select payment links"
on public.payment_links
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

create policy "admins insert payment links"
on public.payment_links
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

create policy "admins update payment links"
on public.payment_links
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

revoke insert, update on public.payment_links from authenticated;
grant select on public.payment_links to authenticated;
grant insert (client_name, payment_name, amount)
on public.payment_links to authenticated;
grant update (client_name, payment_name, amount)
on public.payment_links to authenticated;
grant all on public.payment_links to service_role;
