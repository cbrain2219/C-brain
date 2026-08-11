-- Destructive payment-ledger replacement.
-- Review before running: legacy payment_links/payment_orders rows are removed.
-- Product, content, profile, and auth tables are not modified.
-- Standalone: payment RLS reads the admin role from Supabase Auth app_metadata.

begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

-- Remove only the legacy one-time LinkPay implementation.
drop function if exists public.complete_payment_order(
  text,
  bigint,
  text,
  text,
  text,
  text,
  text,
  timestamptz
);
drop function if exists public.get_or_create_payment_order(uuid);

drop table if exists public.payment_orders;
drop table if exists public.payment_links;

drop function if exists public.enforce_payment_order_status_transition();
drop function if exists public.prevent_locked_payment_link_update();
drop function if exists public.set_payment_orders_updated_at();
drop function if exists public.set_payment_links_updated_at();
drop type if exists public.payment_link_status;

create type public.order_channel as enum ('site', 'linkpay');

create type public.order_status as enum (
  'open',
  'payment_pending',
  'paid',
  'partially_refunded',
  'refunded'
);

create type public.payment_status as enum (
  'ready',
  'unknown',
  'paid',
  'failed',
  'partial_cancelled',
  'cancelled',
  'expired'
);

create type public.refund_status as enum (
  'requested',
  'unknown',
  'succeeded',
  'failed'
);

create table public.payment_links (
  id uuid primary key default gen_random_uuid(),
  public_token uuid not null unique default gen_random_uuid(),
  client_name text not null
    check (char_length(trim(client_name)) between 1 and 100),
  payment_name text not null
    check (char_length(trim(payment_name)) between 1 and 100),
  amount bigint not null check (amount between 1 and 999999999999),
  category text not null
    check (char_length(trim(category)) between 1 and 100),
  service text not null
    check (char_length(trim(service)) between 1 and 100),
  paper text not null
    check (char_length(trim(paper)) between 1 and 100),
  page_quantity text not null
    check (char_length(trim(page_quantity)) between 1 and 100),
  disabled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  public_token uuid not null unique default gen_random_uuid(),
  checkout_request_id uuid not null unique,
  payment_link_id uuid references public.payment_links(id) on delete restrict,
  channel public.order_channel not null,
  customer_label text not null
    check (char_length(trim(customer_label)) between 1 and 100),
  order_name text not null
    check (char_length(trim(order_name)) between 1 and 100),
  amount bigint not null check (amount between 1 and 999999999999),
  currency text not null default 'KRW' check (currency = 'KRW'),
  item_snapshot jsonb not null check (jsonb_typeof(item_snapshot) = 'object'),
  buyer_name text not null
    check (char_length(trim(buyer_name)) between 1 and 30),
  buyer_company text
    check (
      buyer_company is null
      or char_length(trim(buyer_company)) between 1 and 100
    ),
  buyer_phone text not null check (buyer_phone ~ '^01[016789][0-9]{7,8}$'),
  buyer_email text not null
    check (char_length(trim(buyer_email)) between 3 and 60),
  privacy_agreed_at timestamptz not null,
  status public.order_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_channel_payment_link_check check (
    (channel = 'site' and payment_link_id is null)
    or (channel = 'linkpay' and payment_link_id is not null)
  ),
  constraint orders_snapshot_channel_check check (
    item_snapshot ->> 'channel' = channel::text
  )
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  provider_order_id text not null unique
    check (provider_order_id ~ '^[A-Za-z0-9_-]{1,64}$'),
  amount bigint not null check (amount between 1 and 999999999999),
  balance_amount bigint check (balance_amount between 0 and amount),
  status public.payment_status not null default 'ready',
  nicepay_tid text unique
    check (nicepay_tid is null or char_length(nicepay_tid) between 1 and 30),
  result_code text,
  result_message text,
  pay_method text,
  receipt_url text,
  can_part_cancel boolean,
  paid_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_completed_shape_check check (
    status not in ('paid', 'partial_cancelled', 'cancelled')
    or (nicepay_tid is not null and paid_at is not null and balance_amount is not null)
  ),
  constraint payments_balance_status_check check (
    (status <> 'paid' or balance_amount = amount)
    and (
      status <> 'partial_cancelled'
      or (balance_amount > 0 and balance_amount < amount)
    )
    and (status <> 'cancelled' or balance_amount = 0)
  )
);

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete restrict,
  request_id uuid not null unique,
  provider_refund_order_id text not null unique
    check (provider_refund_order_id ~ '^[A-Za-z0-9_-]{1,64}$'),
  amount bigint not null check (amount between 1 and 999999999999),
  reason text not null check (char_length(trim(reason)) between 1 and 100),
  status public.refund_status not null default 'requested',
  requested_by uuid not null,
  nicepay_cancelled_tid text unique
    check (
      nicepay_cancelled_tid is null
      or char_length(nicepay_cancelled_tid) between 1 and 30
    ),
  result_code text,
  result_message text,
  receipt_url text,
  requested_at timestamptz not null default now(),
  refunded_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint refunds_succeeded_shape_check check (
    status <> 'succeeded'
    or (nicepay_cancelled_tid is not null and refunded_at is not null)
  )
);

create index payment_links_created_at_idx
  on public.payment_links (created_at desc);
create index orders_channel_created_at_idx
  on public.orders (channel, created_at desc);
create index orders_payment_link_id_idx
  on public.orders (payment_link_id)
  where payment_link_id is not null;
create index payments_order_id_idx
  on public.payments (order_id);
create index payments_paid_at_idx
  on public.payments (paid_at desc)
  where paid_at is not null;
create index payments_status_created_at_idx
  on public.payments (status, created_at desc);
create unique index payments_one_blocking_attempt_per_order
  on public.payments (order_id)
  where status in ('ready', 'unknown', 'paid', 'partial_cancelled', 'cancelled');
create index refunds_payment_id_idx
  on public.refunds (payment_id);
create index refunds_refunded_at_idx
  on public.refunds (refunded_at desc)
  where refunded_at is not null;
create index refunds_status_requested_at_idx
  on public.refunds (status, requested_at desc);

create function public.set_payment_ledger_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger payment_links_set_updated_at
before update on public.payment_links
for each row execute function public.set_payment_ledger_updated_at();

create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_payment_ledger_updated_at();

create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_payment_ledger_updated_at();

create trigger refunds_set_updated_at
before update on public.refunds
for each row execute function public.set_payment_ledger_updated_at();

create function public.create_site_checkout(
  p_checkout_request_id uuid,
  p_provider_order_id text,
  p_customer_label text,
  p_order_name text,
  p_amount bigint,
  p_item_snapshot jsonb,
  p_buyer_name text,
  p_buyer_company text,
  p_buyer_phone text,
  p_buyer_email text,
  p_privacy_agreed_at timestamptz
)
returns table (
  amount bigint,
  order_id uuid,
  order_name text,
  order_public_token uuid,
  payment_id uuid,
  provider_order_id text
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_attempt_count integer;
  v_order public.orders%rowtype;
  v_payment public.payments%rowtype;
  v_provider_order_id text;
  v_suffix text;
begin
  if p_checkout_request_id is null then
    raise exception 'checkout_request_id is required.';
  end if;

  if p_provider_order_id is null
    or p_provider_order_id !~ '^[A-Za-z0-9_-]{1,64}$' then
    raise exception 'Invalid provider_order_id.';
  end if;

  if p_item_snapshot is null
    or jsonb_typeof(p_item_snapshot) <> 'object'
    or p_item_snapshot ->> 'channel' <> 'site' then
    raise exception 'A site item snapshot must use the site channel.';
  end if;

  select checkout_order.*
  into v_order
  from public.orders as checkout_order
  where checkout_order.checkout_request_id = p_checkout_request_id
  for update;

  if not found then
    insert into public.orders (
      checkout_request_id,
      channel,
      customer_label,
      order_name,
      amount,
      item_snapshot,
      buyer_name,
      buyer_company,
      buyer_phone,
      buyer_email,
      privacy_agreed_at,
      status
    )
    values (
      p_checkout_request_id,
      'site',
      trim(p_customer_label),
      trim(p_order_name),
      p_amount,
      p_item_snapshot,
      trim(p_buyer_name),
      nullif(trim(p_buyer_company), ''),
      p_buyer_phone,
      trim(p_buyer_email),
      p_privacy_agreed_at,
      'payment_pending'
    )
    on conflict (checkout_request_id) do nothing
    returning * into v_order;

    if not found then
      select checkout_order.*
      into strict v_order
      from public.orders as checkout_order
      where checkout_order.checkout_request_id = p_checkout_request_id
      for update;
    end if;
  end if;

  if v_order.channel <> 'site'
    or v_order.payment_link_id is not null
    or v_order.amount <> p_amount
    or v_order.customer_label <> trim(p_customer_label)
    or v_order.order_name <> trim(p_order_name)
    or v_order.item_snapshot <> p_item_snapshot
    or v_order.buyer_name <> trim(p_buyer_name)
    or v_order.buyer_company is distinct from nullif(trim(p_buyer_company), '')
    or v_order.buyer_phone <> p_buyer_phone
    or v_order.buyer_email <> trim(p_buyer_email) then
    raise exception 'checkout_request_id was already used with different site checkout data.';
  end if;

  select payment_attempt.*
  into v_payment
  from public.payments as payment_attempt
  where payment_attempt.order_id = v_order.id
    and payment_attempt.status in (
      'ready',
      'unknown',
      'paid',
      'partial_cancelled',
      'cancelled'
    )
  order by payment_attempt.created_at desc, payment_attempt.id
  limit 1
  for update;

  if not found then
    select count(*)::integer
    into v_attempt_count
    from public.payments as payment_attempt
    where payment_attempt.order_id = v_order.id;

    if v_attempt_count = 0 then
      v_provider_order_id := p_provider_order_id;
    else
      v_suffix := '_' || (v_attempt_count + 1)::text;
      v_provider_order_id :=
        left(p_provider_order_id, 64 - char_length(v_suffix)) || v_suffix;
    end if;

    insert into public.payments (order_id, provider_order_id, amount)
    values (v_order.id, v_provider_order_id, v_order.amount)
    returning * into strict v_payment;

    update public.orders
    set status = 'payment_pending'
    where id = v_order.id
    returning * into strict v_order;
  end if;

  return query
  select
    v_order.amount,
    v_order.id,
    v_order.order_name,
    v_order.public_token,
    v_payment.id,
    v_payment.provider_order_id;
end;
$$;

create function public.create_linkpay_checkout(
  p_public_token uuid,
  p_checkout_request_id uuid,
  p_provider_order_id text,
  p_customer_label text,
  p_buyer_name text,
  p_buyer_company text,
  p_buyer_phone text,
  p_buyer_email text,
  p_privacy_agreed_at timestamptz
)
returns table (
  amount bigint,
  order_id uuid,
  order_name text,
  order_public_token uuid,
  payment_id uuid,
  provider_order_id text
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_attempt_count integer;
  v_link public.payment_links%rowtype;
  v_order public.orders%rowtype;
  v_payment public.payments%rowtype;
  v_provider_order_id text;
  v_suffix text;
begin
  if p_checkout_request_id is null then
    raise exception 'checkout_request_id is required.';
  end if;

  if p_provider_order_id is null
    or p_provider_order_id !~ '^[A-Za-z0-9_-]{1,64}$' then
    raise exception 'Invalid provider_order_id.';
  end if;

  select payment_link.*
  into v_link
  from public.payment_links as payment_link
  where payment_link.public_token = p_public_token
  for share;

  if not found then
    raise exception 'Payment link not found.';
  end if;

  if v_link.disabled_at is not null then
    raise exception 'Payment link is disabled.';
  end if;

  select checkout_order.*
  into v_order
  from public.orders as checkout_order
  where checkout_order.checkout_request_id = p_checkout_request_id
  for update;

  if not found then
    insert into public.orders (
      checkout_request_id,
      payment_link_id,
      channel,
      customer_label,
      order_name,
      amount,
      item_snapshot,
      buyer_name,
      buyer_company,
      buyer_phone,
      buyer_email,
      privacy_agreed_at,
      status
    )
    values (
      p_checkout_request_id,
      v_link.id,
      'linkpay',
      trim(p_customer_label),
      v_link.payment_name,
      v_link.amount,
      jsonb_build_object(
        'channel', 'linkpay',
        'paymentLinkId', v_link.id,
        'clientName', v_link.client_name,
        'paymentName', v_link.payment_name,
        'amount', v_link.amount,
        'category', v_link.category,
        'service', v_link.service,
        'paper', v_link.paper,
        'pageQuantity', v_link.page_quantity
      ),
      trim(p_buyer_name),
      nullif(trim(p_buyer_company), ''),
      p_buyer_phone,
      trim(p_buyer_email),
      p_privacy_agreed_at,
      'payment_pending'
    )
    on conflict (checkout_request_id) do nothing
    returning * into v_order;

    if not found then
      select checkout_order.*
      into strict v_order
      from public.orders as checkout_order
      where checkout_order.checkout_request_id = p_checkout_request_id
      for update;
    end if;
  end if;

  if v_order.channel <> 'linkpay'
    or v_order.payment_link_id is distinct from v_link.id
    or v_order.customer_label <> trim(p_customer_label)
    or v_order.buyer_name <> trim(p_buyer_name)
    or v_order.buyer_company is distinct from nullif(trim(p_buyer_company), '')
    or v_order.buyer_phone <> p_buyer_phone
    or v_order.buyer_email <> trim(p_buyer_email) then
    raise exception 'checkout_request_id was already used with different LinkPay checkout data.';
  end if;

  select payment_attempt.*
  into v_payment
  from public.payments as payment_attempt
  where payment_attempt.order_id = v_order.id
    and payment_attempt.status in (
      'ready',
      'unknown',
      'paid',
      'partial_cancelled',
      'cancelled'
    )
  order by payment_attempt.created_at desc, payment_attempt.id
  limit 1
  for update;

  if not found then
    select count(*)::integer
    into v_attempt_count
    from public.payments as payment_attempt
    where payment_attempt.order_id = v_order.id;

    if v_attempt_count = 0 then
      v_provider_order_id := p_provider_order_id;
    else
      v_suffix := '_' || (v_attempt_count + 1)::text;
      v_provider_order_id :=
        left(p_provider_order_id, 64 - char_length(v_suffix)) || v_suffix;
    end if;

    insert into public.payments (order_id, provider_order_id, amount)
    values (v_order.id, v_provider_order_id, v_order.amount)
    returning * into strict v_payment;

    update public.orders
    set status = 'payment_pending'
    where id = v_order.id
    returning * into strict v_order;
  end if;

  return query
  select
    v_order.amount,
    v_order.id,
    v_order.order_name,
    v_order.public_token,
    v_payment.id,
    v_payment.provider_order_id;
end;
$$;

create function public.finish_payment(
  p_provider_order_id text,
  p_status public.payment_status,
  p_amount bigint,
  p_balance_amount bigint,
  p_nicepay_tid text,
  p_result_code text,
  p_result_message text,
  p_pay_method text,
  p_receipt_url text,
  p_can_part_cancel boolean,
  p_paid_at timestamptz,
  p_cancelled_at timestamptz
)
returns setof public.payments
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_order_id uuid;
  v_payment public.payments%rowtype;
begin
  if p_status not in ('paid', 'failed', 'expired', 'unknown') then
    raise exception 'finish_payment cannot write the requested status.';
  end if;

  select payment_record.order_id
  into v_order_id
  from public.payments as payment_record
  where payment_record.provider_order_id = p_provider_order_id;

  if not found then
    raise exception 'Payment not found.';
  end if;

  -- All ledger writers lock Order before Payment to avoid lock-order cycles.
  select checkout_order.*
  into strict v_order
  from public.orders as checkout_order
  where checkout_order.id = v_order_id
  for update;

  select payment_record.*
  into strict v_payment
  from public.payments as payment_record
  where payment_record.provider_order_id = p_provider_order_id
  for update;

  if v_payment.order_id <> v_order.id then
    raise exception 'Payment order changed during finalization.';
  end if;

  if v_payment.amount <> p_amount then
    raise exception 'Payment amount mismatch.';
  end if;

  if v_payment.nicepay_tid is not null
    and p_nicepay_tid is not null
    and v_payment.nicepay_tid <> p_nicepay_tid then
    raise exception 'Payment TID mismatch.';
  end if;

  -- Verified terminal results cannot be regressed by delayed callbacks.
  if v_payment.status in ('paid', 'partial_cancelled', 'cancelled') then
    if p_status <> 'unknown'
      or p_result_code is distinct from 'UNEXPECTED_CANCELLATION' then
      return query
      select payment_record.*
      from public.payments as payment_record
      where payment_record.id = v_payment.id;
      return;
    end if;
  end if;

  if v_payment.status in ('failed', 'expired') then
    return query
    select payment_record.*
    from public.payments as payment_record
    where payment_record.id = v_payment.id;
    return;
  end if;

  if v_payment.status = 'unknown'
    and v_payment.result_code = 'UNEXPECTED_CANCELLATION'
    and p_status <> 'unknown'
    and not (
      p_status = 'paid'
      and v_payment.balance_amount = v_payment.amount
      and v_order.status = 'paid'
    ) then
    return query
    select payment_record.*
    from public.payments as payment_record
    where payment_record.id = v_payment.id;
    return;
  end if;

  -- Do not let a weaker retry erase the durable net-cancel/manual-review marker.
  if v_payment.status = 'unknown' and p_status = 'unknown' then
    if v_payment.result_code = 'NET_CANCEL_PERSISTENCE_UNKNOWN'
      and p_result_code is distinct from 'NET_CANCEL_PERSISTENCE_UNKNOWN' then
      return query
      select payment_record.*
      from public.payments as payment_record
      where payment_record.id = v_payment.id;
      return;
    end if;

    if v_payment.result_code = 'NET_CANCEL_REQUESTED'
      and p_result_code not in (
        'NET_CANCEL_REQUESTED',
        'NET_CANCEL_PERSISTENCE_UNKNOWN'
      ) then
      return query
      select payment_record.*
      from public.payments as payment_record
      where payment_record.id = v_payment.id;
      return;
    end if;

    if v_payment.result_code = 'UNEXPECTED_CANCELLATION'
      and p_result_code is distinct from 'UNEXPECTED_CANCELLATION' then
      return query
      select payment_record.*
      from public.payments as payment_record
      where payment_record.id = v_payment.id;
      return;
    end if;
  end if;

  if p_balance_amount is not null
    and (p_balance_amount < 0 or p_balance_amount > v_payment.amount) then
    raise exception 'Invalid provider balance.';
  end if;

  if p_status = 'paid' and (
    p_result_code is distinct from '0000'
    or p_nicepay_tid is null
    or char_length(p_nicepay_tid) not between 1 and 30
    or p_paid_at is null
    or p_cancelled_at is not null
    or p_balance_amount is distinct from v_payment.amount
  ) then
    raise exception 'Invalid successful payment result.';
  end if;

  update public.payments
  set
    balance_amount = coalesce(p_balance_amount, v_payment.balance_amount),
    status = p_status,
    nicepay_tid = coalesce(p_nicepay_tid, v_payment.nicepay_tid),
    result_code = coalesce(p_result_code, v_payment.result_code),
    result_message = coalesce(p_result_message, v_payment.result_message),
    pay_method = coalesce(p_pay_method, v_payment.pay_method),
    receipt_url = coalesce(p_receipt_url, v_payment.receipt_url),
    can_part_cancel = coalesce(p_can_part_cancel, v_payment.can_part_cancel),
    paid_at = coalesce(p_paid_at, v_payment.paid_at),
    cancelled_at = coalesce(p_cancelled_at, v_payment.cancelled_at)
  where id = v_payment.id
  returning * into strict v_payment;

  if p_status = 'paid' then
    update public.orders
    set status = 'paid'
    where id = v_order.id;
  elsif p_status = 'unknown'
    and p_result_code = 'UNEXPECTED_CANCELLATION'
    and v_order.status in ('paid', 'partially_refunded', 'refunded') then
    -- Keep the customer-facing Order result stable while Payment needs review.
    null;
  elsif p_status = 'unknown' then
    update public.orders
    set status = 'payment_pending'
    where id = v_order.id;
  else
    update public.orders
    set status = 'open'
    where id = v_order.id;
  end if;

  return query
  select payment_record.*
  from public.payments as payment_record
  where payment_record.id = v_payment.id;
end;
$$;

create function public.reserve_refund(
  p_payment_id uuid,
  p_request_id uuid,
  p_provider_refund_order_id text,
  p_amount bigint,
  p_reason text,
  p_requested_by uuid
)
returns table (
  amount bigint,
  can_part_cancel boolean,
  nicepay_tid text,
  payment_amount bigint,
  payment_balance_amount bigint,
  payment_id uuid,
  provider_order_id text,
  refund_id uuid,
  refund_status public.refund_status,
  should_execute boolean
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_outstanding_amount bigint;
  v_payment public.payments%rowtype;
  v_refund public.refunds%rowtype;
begin
  if p_request_id is null or p_requested_by is null then
    raise exception 'Refund request identity is required.';
  end if;

  if p_provider_refund_order_id is null
    or p_provider_refund_order_id !~ '^[A-Za-z0-9_-]{1,64}$' then
    raise exception 'Invalid provider refund order ID.';
  end if;

  select payment_record.*
  into v_payment
  from public.payments as payment_record
  where payment_record.id = p_payment_id
  for update;

  if not found then
    raise exception 'Payment not found.';
  end if;

  select refund_record.*
  into v_refund
  from public.refunds as refund_record
  where refund_record.request_id = p_request_id
  for update;

  if found then
    if v_refund.payment_id is distinct from p_payment_id
      or v_refund.provider_refund_order_id is distinct from p_provider_refund_order_id
      or v_refund.amount is distinct from p_amount
      or v_refund.reason is distinct from trim(p_reason)
      or v_refund.requested_by is distinct from p_requested_by then
      raise exception 'request_id was already used with different refund data.';
    end if;

    return query
    select
      v_refund.amount,
      v_payment.can_part_cancel,
      v_payment.nicepay_tid,
      v_payment.amount,
      v_payment.balance_amount,
      v_payment.id,
      v_payment.provider_order_id,
      v_refund.id,
      v_refund.status,
      false;
    return;
  end if;

  if v_payment.status not in ('paid', 'partial_cancelled')
    or v_payment.balance_amount is null
    or v_payment.balance_amount = 0 then
    raise exception 'Payment is not refundable.';
  end if;

  if p_amount is null or p_amount < 1 or p_amount > v_payment.balance_amount then
    raise exception 'Refund amount exceeds the refundable balance.';
  end if;

  select coalesce(sum(refund_record.amount), 0)::bigint
  into v_outstanding_amount
  from public.refunds as refund_record
  where refund_record.payment_id = v_payment.id
    and refund_record.status in ('requested', 'unknown');

  if v_outstanding_amount + p_amount > v_payment.balance_amount then
    raise exception 'Refund amount exceeds the unreserved balance.';
  end if;

  insert into public.refunds (
    payment_id,
    request_id,
    provider_refund_order_id,
    amount,
    reason,
    requested_by
  )
  values (
    v_payment.id,
    p_request_id,
    p_provider_refund_order_id,
    p_amount,
    trim(p_reason),
    p_requested_by
  )
  returning * into strict v_refund;

  return query
  select
    v_refund.amount,
    v_payment.can_part_cancel,
    v_payment.nicepay_tid,
    v_payment.amount,
    v_payment.balance_amount,
    v_payment.id,
    v_payment.provider_order_id,
    v_refund.id,
    v_refund.status,
    true;
end;
$$;

create function public.finish_refund(
  p_request_id uuid,
  p_status public.refund_status,
  p_balance_amount bigint,
  p_nicepay_cancelled_tid text,
  p_result_code text,
  p_result_message text,
  p_receipt_url text,
  p_refunded_at timestamptz
)
returns table (
  payment_status public.payment_status,
  refundable_amount bigint,
  refunded_amount bigint,
  status public.refund_status
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_order_id uuid;
  v_payment public.payments%rowtype;
  v_payment_id uuid;
  v_refund public.refunds%rowtype;
begin
  if p_status is null or p_status not in ('succeeded', 'failed', 'unknown') then
    raise exception 'finish_refund cannot write the requested status.';
  end if;

  select refund_record.payment_id, payment_record.order_id
  into v_payment_id, v_order_id
  from public.refunds as refund_record
  join public.payments as payment_record
    on payment_record.id = refund_record.payment_id
  where refund_record.request_id = p_request_id;

  if not found then
    raise exception 'Refund not found.';
  end if;

  -- Match finish_payment's Order -> Payment lock order, then lock Refund.
  select checkout_order.*
  into strict v_order
  from public.orders as checkout_order
  where checkout_order.id = v_order_id
  for update;

  select payment_record.*
  into strict v_payment
  from public.payments as payment_record
  where payment_record.id = v_payment_id
  for update;

  select refund_record.*
  into strict v_refund
  from public.refunds as refund_record
  where refund_record.request_id = p_request_id
  for update;

  if v_payment.order_id <> v_order.id
    or v_refund.payment_id <> v_payment.id then
    raise exception 'Refund ledger relation changed during finalization.';
  end if;

  -- Provider retries after a terminal result are idempotent and never regress it.
  if v_refund.status = 'succeeded' then
    if p_status = 'succeeded'
      and p_nicepay_cancelled_tid is not null
      and v_refund.nicepay_cancelled_tid <> p_nicepay_cancelled_tid then
      raise exception 'Refund cancellation TID mismatch.';
    end if;

    return query
    select
      v_payment.status,
      coalesce(v_payment.balance_amount, 0),
      v_refund.amount,
      v_refund.status;
    return;
  end if;

  if v_refund.status = 'failed' then
    return query
    select
      v_payment.status,
      coalesce(v_payment.balance_amount, 0),
      v_refund.amount,
      v_refund.status;
    return;
  end if;

  if p_status = 'unknown' then
    update public.refunds
    set
      status = 'unknown',
      nicepay_cancelled_tid = coalesce(
        p_nicepay_cancelled_tid,
        v_refund.nicepay_cancelled_tid
      ),
      result_code = coalesce(p_result_code, v_refund.result_code),
      result_message = coalesce(p_result_message, v_refund.result_message),
      receipt_url = coalesce(p_receipt_url, v_refund.receipt_url),
      refunded_at = coalesce(p_refunded_at, v_refund.refunded_at)
    where id = v_refund.id
    returning * into strict v_refund;

    return query
    select
      v_payment.status,
      coalesce(v_payment.balance_amount, 0),
      v_refund.amount,
      v_refund.status;
    return;
  end if;

  if p_status = 'failed' then
    update public.refunds
    set
      status = 'failed',
      result_code = coalesce(p_result_code, v_refund.result_code),
      result_message = coalesce(p_result_message, v_refund.result_message),
      receipt_url = coalesce(p_receipt_url, v_refund.receipt_url)
    where id = v_refund.id
    returning * into strict v_refund;

    return query
    select
      v_payment.status,
      coalesce(v_payment.balance_amount, 0),
      v_refund.amount,
      v_refund.status;
    return;
  end if;

  if v_payment.status not in ('paid', 'partial_cancelled', 'unknown')
    or v_payment.balance_amount is null then
    raise exception 'Payment is not in a refundable state.';
  end if;

  if p_result_code is distinct from '0000'
    or p_nicepay_cancelled_tid is null
    or char_length(p_nicepay_cancelled_tid) not between 1 and 30
    or p_refunded_at is null then
    raise exception 'Invalid successful refund result.';
  end if;

  if v_refund.amount > v_payment.balance_amount
    or p_balance_amount is distinct from (
      v_payment.balance_amount - v_refund.amount
    ) then
    raise exception 'Provider refund balance mismatch.';
  end if;

  update public.refunds
  set
    status = 'succeeded',
    nicepay_cancelled_tid = p_nicepay_cancelled_tid,
    result_code = p_result_code,
    result_message = p_result_message,
    receipt_url = p_receipt_url,
    refunded_at = p_refunded_at
  where id = v_refund.id
  returning * into strict v_refund;

  update public.payments
  set
    balance_amount = p_balance_amount,
    status = case
      when p_balance_amount = 0 then 'cancelled'::public.payment_status
      else 'partial_cancelled'::public.payment_status
    end,
    cancelled_at = p_refunded_at
  where id = v_payment.id
  returning * into strict v_payment;

  update public.orders
  set status = case
    when p_balance_amount = 0 then 'refunded'::public.order_status
    else 'partially_refunded'::public.order_status
  end
  where id = v_order.id
  returning * into strict v_order;

  return query
  select
    v_payment.status,
    v_payment.balance_amount,
    v_refund.amount,
    v_refund.status;
end;
$$;

alter table public.payment_links enable row level security;
alter table public.orders enable row level security;
alter table public.payments enable row level security;
alter table public.refunds enable row level security;

create policy "admins select payment links"
on public.payment_links
for select
to authenticated
using (
  coalesce(
    (select auth.jwt() -> 'app_metadata' ->> 'role'),
    ''
  ) = 'admin'
);

create policy "admins insert payment links"
on public.payment_links
for insert
to authenticated
with check (
  coalesce(
    (select auth.jwt() -> 'app_metadata' ->> 'role'),
    ''
  ) = 'admin'
);

create policy "admins update payment links"
on public.payment_links
for update
to authenticated
using (
  coalesce(
    (select auth.jwt() -> 'app_metadata' ->> 'role'),
    ''
  ) = 'admin'
)
with check (
  coalesce(
    (select auth.jwt() -> 'app_metadata' ->> 'role'),
    ''
  ) = 'admin'
);

create policy "admins delete unused payment links"
on public.payment_links
for delete
to authenticated
using (
  coalesce(
    (select auth.jwt() -> 'app_metadata' ->> 'role'),
    ''
  ) = 'admin'
  and not exists (
    select 1
    from public.orders as checkout_order
    where checkout_order.payment_link_id = payment_links.id
  )
);

create policy "admins select orders"
on public.orders
for select
to authenticated
using (
  coalesce(
    (select auth.jwt() -> 'app_metadata' ->> 'role'),
    ''
  ) = 'admin'
);

create policy "admins select payments"
on public.payments
for select
to authenticated
using (
  coalesce(
    (select auth.jwt() -> 'app_metadata' ->> 'role'),
    ''
  ) = 'admin'
);

create policy "admins select refunds"
on public.refunds
for select
to authenticated
using (
  coalesce(
    (select auth.jwt() -> 'app_metadata' ->> 'role'),
    ''
  ) = 'admin'
);

revoke all on public.payment_links, public.orders, public.payments, public.refunds
  from public, anon, authenticated;

grant select on public.payment_links to authenticated;
grant insert (
  client_name,
  payment_name,
  amount,
  category,
  service,
  paper,
  page_quantity
) on public.payment_links to authenticated;
grant update (
  client_name,
  payment_name,
  amount,
  category,
  service,
  paper,
  page_quantity,
  disabled_at
) on public.payment_links to authenticated;
grant delete on public.payment_links to authenticated;
grant select on public.orders, public.payments, public.refunds to authenticated;

grant all on public.payment_links, public.orders, public.payments, public.refunds
  to service_role;

revoke execute on function public.set_payment_ledger_updated_at()
  from public, anon, authenticated;

revoke execute on function public.create_site_checkout(
  uuid,
  text,
  text,
  text,
  bigint,
  jsonb,
  text,
  text,
  text,
  text,
  timestamptz
) from public, anon, authenticated;

revoke execute on function public.create_linkpay_checkout(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  timestamptz
) from public, anon, authenticated;

revoke execute on function public.finish_payment(
  text,
  public.payment_status,
  bigint,
  bigint,
  text,
  text,
  text,
  text,
  text,
  boolean,
  timestamptz,
  timestamptz
) from public, anon, authenticated;

revoke execute on function public.reserve_refund(
  uuid,
  uuid,
  text,
  bigint,
  text,
  uuid
) from public, anon, authenticated;

revoke execute on function public.finish_refund(
  uuid,
  public.refund_status,
  bigint,
  text,
  text,
  text,
  text,
  timestamptz
) from public, anon, authenticated;

grant execute on function public.create_site_checkout(
  uuid,
  text,
  text,
  text,
  bigint,
  jsonb,
  text,
  text,
  text,
  text,
  timestamptz
) to service_role;

grant execute on function public.create_linkpay_checkout(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  timestamptz
) to service_role;

grant execute on function public.finish_payment(
  text,
  public.payment_status,
  bigint,
  bigint,
  text,
  text,
  text,
  text,
  text,
  boolean,
  timestamptz,
  timestamptz
) to service_role;

grant execute on function public.reserve_refund(
  uuid,
  uuid,
  text,
  bigint,
  text,
  uuid
) to service_role;

grant execute on function public.finish_refund(
  uuid,
  public.refund_status,
  bigint,
  text,
  text,
  text,
  text,
  timestamptz
) to service_role;

commit;
