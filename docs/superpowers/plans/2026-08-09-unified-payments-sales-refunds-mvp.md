# Unified Site and LinkPay Payments, Sales, and Refunds MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사이트의 정찰제 일반 주문과 관리자가 발급하는 LinkPay가 하나의 NICEPAY 결제·매출·환불 원장을 사용하도록 최소 기능부터 단계적으로 구현한다.

**Architecture:** `orders`, `payments`, `refunds` 세 테이블만 거래 원장으로 사용한다. `orders.channel`이 `site`와 `linkpay`를 구분하고, 채널별 코드는 주문을 만드는 지점까지만 분리한다. 이후 결제 준비, NICEPAY 승인 검증, 웹훅, 결과 불명 복구, 매출 집계, 전액·부분환불은 같은 서비스와 상태 규칙을 공유한다.

**Tech Stack:** React 19, Next.js 16 App Router, Vite admin, TypeScript 5.9, Supabase/PostgreSQL, Supabase CLI 2.113.0, NICEPAY JS SDK 및 Server 승인·조회·취소 API

## Global Constraints

- 이 계획은 기존 결제 데이터가 개발용이며 삭제 가능하다는 사용자 설명을 전제로 한다. 실거래가 한 건이라도 확인되면 기존 payment migration 삭제와 `db reset`을 중단하고 forward migration으로 다시 계획한다.
- 1차 결제수단은 KRW 카드 결제만 지원한다. 계좌이체, 가상계좌, 간편결제, 정기결제는 제외한다.
- 사이트 일반 주문과 LinkPay는 별도 결제 원장을 만들지 않는다. 차이는 `orders.channel`과 주문 스냅샷뿐이다.
- 일반 주문 금액은 서버가 현재 `apps/user/app/_content/order.ts` 카탈로그로 다시 계산한다. 브라우저가 보낸 합계·라벨·단가는 저장 또는 승인 기준으로 사용하지 않는다.
- LinkPay 금액과 항목은 관리자가 생성한 `orders` 행에서만 읽는다. 결제 시도가 생긴 뒤 금액과 항목은 수정할 수 없다.
- NICEPAY 주문번호, 승인 TID, 환불 요청 ID, 환불 주문번호, 취소 TID는 각각 고유해야 한다.
- 승인·환불 결과가 불명확하면 실패로 간주하지 않고 `unknown`으로 잠근다. 조회나 검증된 웹훅으로 확정되기 전에는 재결제 또는 추가 환불을 허용하지 않는다.
- 매출은 성공 승인액, 환불은 성공 취소액, 순매출은 두 값의 차이다. 별도 `sales` 테이블과 추정 정산액·카드 수수료는 만들지 않는다.
- Supabase secret/service-role 키와 NICEPAY secret key는 서버에서만 사용한다. 고객정보와 provider payload를 로그에 남기지 않는다.
- public 스키마의 새 테이블은 RLS와 명시적 `GRANT`를 같은 migration에 둔다. `anon`은 결제 원장에 직접 접근하지 않는다.
- 기존 주문·LinkPay·매출 UI 구조와 디자인은 유지한다. 이 계획은 결제 상태 표시와 실제 데이터 연결에 필요한 최소 JSX만 바꾸며 CSS 재설계를 포함하지 않는다.
- 기존의 사용자 작업 중인 변경을 되돌리지 않는다. 이 계획에 명시된 파일만 수정하고 요청 전에는 커밋·푸시·배포·원격 DB 쓰기를 하지 않는다.

---

## 확인된 현재 상태

| 영역             | 현재                                                                                                 | 이 계획의 목표                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 사이트 일반 결제 | 상품·옵션·고객정보 UI와 서버 금액 재계산이 있으나 `payment-not-ready`로 종료                         | 서버 주문 생성부터 NICEPAY 승인·결과 페이지까지 완주               |
| LinkPay          | 전용 `payment_links`/`payment_orders`와 NICEPAY return/webhook 일부 구현, 공개 페이지는 fixture 의존 | `orders(channel = 'linkpay')`로 옮기고 공통 결제 파이프라인 재사용 |
| NICEPAY return   | `token` query와 LinkPay URL에 결합                                                                   | callback `orderId`로 payment를 찾고 DB의 channel로 결과 URL 결정   |
| 매출             | fixture와 로컬 환불 상태                                                                             | 두 채널의 검증된 승인·환불 event를 기간·채널별 집계                |
| 환불             | dialog만 있고 provider 호출 없음                                                                     | 관리자 인증, 중복 방지, 전액·부분취소, 결과 불명 처리              |

전체 흐름은 [통합 Archify workflow](./2026-08-09-unified-payments-sales-refunds.workflow.html)를 기준으로 한다. 이전 `2026-08-08-linkpay-sales-refunds-mvp.md`는 LinkPay 단독 가정이므로 이 문서가 대체한다.

## Data Contract

### 주문 스냅샷

`orders.item_snapshot`은 결제 후 상품 설정이 바뀌어도 거래 당시 내용을 보존한다. 애플리케이션 타입은 다음 두 형태만 허용한다.

```ts
export type SiteOrderSnapshot = {
  channel: "site";
  hasPlanning: boolean;
  pageId: string;
  pageLabel: string;
  paperId: string;
  paperLabel: string;
  quantityId: string;
  quantityLabel: string;
  schemaVersion: 1;
  serviceId: string;
  serviceLabel: string;
  unitPrice: number;
};

export type LinkPayOrderSnapshot = {
  category: string;
  channel: "linkpay";
  pageQuantity: string;
  paper: string;
  schemaVersion: 1;
  service: string;
};

export type OrderItemSnapshot = SiteOrderSnapshot | LinkPayOrderSnapshot;
```

사이트 snapshot의 모든 라벨·단가·합계는 서버 카탈로그에서 다시 만든다. LinkPay snapshot은 결제 시도가 생기기 전 관리자 입력만 허용한다.

### 상태 규칙

```text
orders.open
  └─ payment 생성 → orders.payment_pending + payments.ready
       ├─ 검증된 실패/만료 → orders.open + payments.failed|expired
       ├─ 결과 불명 → orders.payment_pending + payments.unknown
       └─ 승인 성공 → orders.paid + payments.paid
            ├─ 부분환불 → orders.partially_refunded + payments.partial_cancelled
            └─ 전액환불 → orders.refunded + payments.cancelled
```

`paid`, `partially_refunded`, `refunded` 주문에는 새 payment를 만들지 않는다. 한 주문에 `ready`, `unknown`, `paid`, `partial_cancelled`, `cancelled` 중 하나가 있으면 다른 payment 시도를 만들지 않는 partial unique index를 둔다.

---

### Task 1: 두 채널을 수용하는 통합 거래 원장

**Files:**

- Delete after development-data verification: `supabase/migrations/20260722000000_create_payment_links.sql`
- Delete after development-data verification: `supabase/migrations/20260723000000_add_payment_link_details.sql`
- Delete after development-data verification: `supabase/migrations/20260723000001_create_payment_orders.sql`
- Delete after development-data verification: `supabase/migrations/20260723000002_allow_admin_payment_link_delete.sql`
- Create via CLI: `supabase/migrations/*_create_unified_payment_ledger.sql`
- Create: `supabase/tests/unified_payment_ledger.sql`
- Modify: `packages/supabase/src/types.ts`
- Create: `packages/supabase/src/orders.ts`
- Create: `packages/supabase/src/payments.ts`
- Modify: `packages/supabase/src/index.ts`
- Replace: `packages/supabase/tests/payment-links-contract.test.mjs` → `packages/supabase/tests/unified-payments-contract.test.mjs`

**Interfaces:**

- Produces `OrderChannel = "site" | "linkpay"`.
- Produces `OrderStatus = "open" | "payment_pending" | "paid" | "partially_refunded" | "refunded"`.
- Produces `PaymentStatus = "ready" | "unknown" | "paid" | "failed" | "partial_cancelled" | "cancelled" | "expired"`.
- Produces `RefundStatus = "requested" | "unknown" | "succeeded" | "failed"`.
- Produces `create_site_checkout(...) -> payments`, `prepare_linkpay_checkout(...) -> payments`, `complete_payment(...) -> payments`, `record_payment_outcome(...) -> payments`, `reserve_payment_refund(...) -> refunds`, `record_refund_outcome(...) -> refunds`, `finalize_payment_refund(...) -> refunds`, `sync_provider_cancellations(...) -> payments`.

- [ ] **Step 1: 로컬 DB가 삭제 가능한지 증거를 남긴다**

  현재 연결 대상과 migration 상태를 먼저 확인한다.

  ```bash
  pnpm dlx supabase@2.113.0 --version
  pnpm dlx supabase@2.113.0 status
  pnpm dlx supabase@2.113.0 migration list --local
  ```

  로컬 DB가 실행 중이면 다음 count를 기록한다.

  ```sql
  select
    (select count(*) from public.payment_links) as payment_links,
    (select count(*) from public.payment_orders) as payment_orders;
  ```

  Expected: 실거래가 없고 사용자 확인이 끝난 경우에만 기존 네 payment migration을 삭제한다. 하나라도 보존 대상이면 이 task를 중단한다.

- [ ] **Step 2: CLI를 고정하고 빈 migration을 생성한다**

  ```bash
  pnpm add -Dw supabase@2.113.0
  pnpm exec supabase --help
  pnpm exec supabase migration new --help
  pnpm exec supabase migration new create_unified_payment_ledger
  ```

  Expected: timestamp가 붙은 빈 `*_create_unified_payment_ledger.sql`이 생성된다.

- [ ] **Step 3: 새 원장 계약 테스트를 먼저 실패시킨다**

  `packages/supabase/tests/unified-payments-contract.test.mjs`가 suffix로 migration을 찾고 다음 객체를 요구하게 한다.

  ```js
  for (const sqlContract of [
    "create table public.orders",
    "create table public.payments",
    "create table public.refunds",
    "create_site_checkout",
    "prepare_linkpay_checkout",
    "complete_payment",
    "record_payment_outcome",
    "reserve_payment_refund",
    "record_refund_outcome",
    "finalize_payment_refund",
    "sync_provider_cancellations",
    "orders.channel",
    "payments.status",
  ]) {
    assert.match(migration, new RegExp(sqlContract.replaceAll(".", "\\.")));
  }

  assert.doesNotMatch(migration, /create table public\.sales/);
  assert.doesNotMatch(migration, /create table public\.payment_links/);
  ```

  Run: `pnpm --filter @repo/supabase test`

  Expected: 빈 migration 때문에 required SQL assertion이 FAIL.

- [ ] **Step 4: 세 테이블과 고유성 제약을 구현한다**

  migration의 핵심 스키마를 다음으로 고정한다.

  ```sql
  create type public.order_channel as enum ('site', 'linkpay');
  create type public.order_status as enum (
    'open', 'payment_pending', 'paid',
    'partially_refunded', 'refunded'
  );
  create type public.payment_status as enum (
    'ready', 'unknown', 'paid', 'failed',
    'partial_cancelled', 'cancelled', 'expired'
  );
  create type public.refund_status as enum (
    'requested', 'unknown', 'succeeded', 'failed'
  );

  create table public.orders (
    id uuid primary key default gen_random_uuid(),
    public_token uuid not null unique default gen_random_uuid(),
    checkout_request_id uuid not null unique default gen_random_uuid(),
    channel public.order_channel not null,
    customer_label text not null check (char_length(trim(customer_label)) between 1 and 100),
    order_name text not null check (char_length(trim(order_name)) between 1 and 100),
    amount bigint not null check (amount between 1 and 999999999999),
    currency text not null default 'KRW' check (currency = 'KRW'),
    item_snapshot jsonb not null check (jsonb_typeof(item_snapshot) = 'object'),
    buyer_name text check (buyer_name is null or char_length(trim(buyer_name)) between 1 and 30),
    buyer_company text check (buyer_company is null or char_length(trim(buyer_company)) <= 100),
    buyer_phone text check (buyer_phone is null or buyer_phone ~ '^01[016789][0-9]{7,8}$'),
    buyer_email text check (buyer_email is null or char_length(trim(buyer_email)) between 3 and 60),
    privacy_agreed_at timestamptz,
    status public.order_status not null default 'open',
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (
      item_snapshot ->> 'channel' = channel::text
      and item_snapshot ->> 'schemaVersion' = '1'
    ),
    check (
      (channel = 'linkpay' and created_by is not null)
      or (channel = 'site' and created_by is null)
    ),
    check (
      status = 'open'
      or (
        buyer_name is not null
        and buyer_phone is not null
        and buyer_email is not null
        and privacy_agreed_at is not null
      )
    )
  );

  create table public.payments (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null references public.orders(id) on delete restrict,
    provider_order_id text not null unique check (
      provider_order_id ~ '^[A-Za-z0-9_-]{1,64}$'
    ),
    amount bigint not null check (amount between 1 and 999999999999),
    balance_amount bigint check (balance_amount between 0 and amount),
    status public.payment_status not null default 'ready',
    nicepay_tid text unique check (
      nicepay_tid is null or char_length(nicepay_tid) between 1 and 30
    ),
    result_code text,
    result_message text,
    pay_method text,
    receipt_url text,
    can_part_cancel boolean,
    paid_at timestamptz,
    cancelled_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create unique index payments_one_blocking_attempt_per_order
    on public.payments (order_id)
    where status in (
      'ready', 'unknown', 'paid', 'partial_cancelled', 'cancelled'
    );

  create table public.refunds (
    id uuid primary key default gen_random_uuid(),
    payment_id uuid not null references public.payments(id) on delete restrict,
    request_id uuid not null unique,
    provider_refund_order_id text not null unique check (
      provider_refund_order_id ~ '^[A-Za-z0-9_-]{1,64}$'
    ),
    amount bigint not null check (amount > 0),
    reason text not null check (char_length(trim(reason)) between 1 and 100),
    status public.refund_status not null default 'requested',
    origin text not null default 'admin' check (origin in ('admin', 'provider')),
    requested_by uuid,
    nicepay_cancelled_tid text unique,
    result_code text,
    result_message text,
    receipt_url text,
    requested_at timestamptz not null default now(),
    refunded_at timestamptz,
    updated_at timestamptz not null default now(),
    check (
      (origin = 'admin' and requested_by is not null)
      or (origin = 'provider' and requested_by is null)
    )
  );
  ```

  `orders(channel, created_at)`, `payments(paid_at)`, `refunds(payment_id)`, `refunds(refunded_at)` index와 공용 `updated_at` trigger를 추가한다.

- [ ] **Step 5: 상태 변경 RPC를 transaction 단위로 구현한다**

  `create_site_checkout`는 서버가 계산한 주문 snapshot과 고객정보를 받아 `orders(channel = 'site', status = 'payment_pending')`와 `payments(status = 'ready')`를 한 transaction에서 만든다. `checkout_request_id`가 이미 있으면 amount, snapshot, 이름·회사·이메일·전화가 모두 같을 때만 기존 payment를 반환하고 하나라도 다르면 예외를 발생시킨다. provider 주문번호는 `PAY` + payment UUID의 하이픈 제거 문자열로 만든다.

  `prepare_linkpay_checkout`는 `public_token`으로 `orders(channel = 'linkpay')`를 `FOR UPDATE` 잠근다.

  ```text
  open + payment 없음       → 고객정보 저장, ready payment 생성
  open + failed/expired만   → 새 ready payment 생성
  ready                     → 같은 payment 반환
  unknown                   → 예외, 새 결제 차단
  paid/partial/refunded     → 예외, 새 결제 차단
  ```

  `complete_payment`는 provider 주문번호로 payment와 order를 같은 순서로 잠그고 DB 금액과 승인 금액을 비교한다. 같은 TID로 이미 `paid`면 idempotent하게 기존 row를 반환하고, 다른 TID면 거절한다. 성공 시 `payments.paid`, `balance_amount = amount`, `orders.paid`를 같은 transaction에 기록한다.

  `record_payment_outcome`은 `failed`, `expired`, `unknown`만 인자로 허용한다. `failed|expired`면 order를 `open`, `unknown`이면 `payment_pending`으로 유지한다. `paid|partial_cancelled|cancelled`를 이 함수로 쓸 수 없게 한다.

  `reserve_payment_refund`는 request ID 재호출 시 기존 refund를 반환하고 payment를 잠근 뒤 새 금액과 기존 `requested + unknown` 예약액의 합이 현재 `balance_amount`를 넘지 않는지 검사한다. 성공 환불은 이미 balance에서 차감되므로 예약 합계에 다시 더하지 않는다. `record_refund_outcome`은 `failed|unknown`만 허용한다. `finalize_payment_refund`는 이번 환불까지의 `succeeded` 합계와 NICEPAY `balanceAmt` 합이 원 payment amount와 같은지 검증한 뒤 payment/order/refund를 한 transaction으로 갱신한다.

  `sync_provider_cancellations`는 payment/order를 잠그고 검증된 provider status, balance, 취소 목록 JSON을 받는다. balance가 기존 값보다 증가하거나 `succeeded` refund 합계와 원 payment amount가 맞지 않으면 payment를 `unknown`으로 잠근다. 정상 목록은 취소 TID로 idempotent upsert한다.

  모든 결제·환불 RPC는 `SECURITY INVOKER`, `SET search_path = public`을 사용하고 `PUBLIC`, `anon`, `authenticated`의 execute를 revoke한 뒤 `service_role`만 grant한다.

- [ ] **Step 6: LinkPay 관리자 쓰기와 원장 읽기 권한을 명시한다**

  세 테이블 모두 RLS를 활성화한다. `orders`에는 admin select와 LinkPay 전용 insert/update/delete 정책을 둔다. authenticated update column은 `customer_label`, `order_name`, `amount`, `item_snapshot`으로 제한한다. update/delete는 `channel = 'linkpay'`, `status = 'open'`, 연결 payment 없음일 때만 허용한다.

  ```sql
  revoke all on public.orders, public.payments, public.refunds
    from anon, authenticated;

  grant select on public.orders, public.payments, public.refunds
    to authenticated;
  grant insert (channel, customer_label, order_name, amount, item_snapshot, created_by)
    on public.orders to authenticated;
  grant update (customer_label, order_name, amount, item_snapshot)
    on public.orders to authenticated;
  grant delete on public.orders to authenticated;

  grant all on public.orders, public.payments, public.refunds
    to service_role;
  ```

  admin 정책은 `public.is_admin()`과 `created_by = (select auth.uid())`를 사용한다. public LinkPay 페이지도 secret server helper를 통해 읽으므로 `anon` 정책을 만들지 않는다.

- [ ] **Step 7: pgTAP으로 원장 불변식을 검증한다**

  `supabase/tests/unified_payment_ledger.sql`에서 최소 다음을 검증한다.
  - site와 linkpay 주문 모두 생성 가능.
  - site checkout의 브라우저 합계가 아니라 RPC 인자 금액이 payment에 복사됨.
  - 한 주문에 동시에 두 ready payment를 만들 수 없음.
  - unknown payment가 있으면 재시도가 차단됨.
  - 같은 승인 TID 재완료는 동일 payment를 반환함.
  - 다른 승인 TID로 같은 주문을 완료하면 실패함.
  - 같은 refund request ID는 동일 refund를 반환함.
  - 예약 환불을 포함한 누계가 balance를 넘으면 실패함.
  - 부분환불은 order를 `partially_refunded`, 전액환불은 `refunded`로 만듦.
  - anon은 세 테이블과 RPC에 접근할 수 없음.

  Run:

  ```bash
  pnpm exec supabase start
  pnpm exec supabase db reset --local --no-seed
  pnpm exec supabase test db --local
  ```

  Expected: 모든 pgTAP assertion 통과.

- [ ] **Step 8: Supabase 타입과 helper를 새 명칭으로 교체한다**

  `orders.ts`는 LinkPay 관리와 공개 token 조회를 담당한다.

  ```ts
  export type OrderRow = TableRow<"orders">;
  export type LinkPayOrderInput = {
    amount: number;
    customer_label: string;
    item_snapshot: LinkPayOrderSnapshot;
    order_name: string;
  };

  export function listAdminLinkPayOrders(
    client: CBrainSupabaseClient,
  ): Promise<OrderRow[]>;
  export function getAdminLinkPayOrder(
    client: CBrainSupabaseClient,
    id: string,
  ): Promise<OrderRow>;
  export function createLinkPayOrder(
    client: CBrainSupabaseClient,
    input: LinkPayOrderInput,
  ): Promise<OrderRow>;
  export function updateOpenLinkPayOrder(
    client: CBrainSupabaseClient,
    id: string,
    input: LinkPayOrderInput,
  ): Promise<OrderRow>;
  export function deleteOpenLinkPayOrder(
    client: CBrainSupabaseClient,
    id: string,
  ): Promise<void>;
  export function getOrderByPublicToken(
    client: CBrainSupabaseClient,
    token: string,
  ): Promise<OrderRow | null>;
  ```

  `createLinkPayOrder`는 `channel = "linkpay"`와 `requireAdmin(client)`가 반환한 `user.id`를 DB input에 주입한다. 호출자가 channel이나 다른 사용자 ID를 전달하는 인터페이스는 만들지 않는다.

  `payments.ts`는 서버 전용 RPC wrapper와 payment 조회를 담당한다.

  ```ts
  export type PaymentRow = TableRow<"payments">;
  export type RefundRow = TableRow<"refunds">;
  export type PaymentWithOrder = PaymentRow & { order: OrderRow };

  export type CreateSiteCheckoutInput = {
    amount: number;
    buyerCompany: string | null;
    buyerEmail: string;
    buyerName: string;
    buyerPhone: string;
    customerLabel: string;
    itemSnapshot: SiteOrderSnapshot;
    orderName: string;
    privacyAgreedAt: string;
    requestId: string;
  };

  export type PrepareLinkPayCheckoutInput = {
    buyerCompany: string | null;
    buyerEmail: string;
    buyerName: string;
    buyerPhone: string;
    privacyAgreedAt: string;
    publicToken: string;
  };

  export type CompletePaymentInput = {
    amount: number;
    canPartCancel: boolean;
    nicepayTid: string;
    paidAt: string;
    payMethod: string | null;
    providerOrderId: string;
    receiptUrl: string | null;
    resultCode: string;
    resultMessage: string;
  };

  export type RecordPaymentOutcomeInput = {
    providerOrderId: string;
    resultCode: string;
    resultMessage: string;
    status: "failed" | "expired" | "unknown";
  };

  export type ReservePaymentRefundInput = {
    amount: number;
    paymentId: string;
    reason: string;
    requestId: string;
    requestedBy: string;
  };

  export type RecordRefundOutcomeInput = {
    refundId: string;
    resultCode: string;
    resultMessage: string;
    status: "failed" | "unknown";
  };

  export type FinalizePaymentRefundInput = {
    balanceAmount: number;
    cancelledTid: string;
    receiptUrl: string | null;
    refundId: string;
    refundedAt: string;
    resultCode: string;
    resultMessage: string;
  };

  export type ProviderCancellationSnapshot = {
    balanceAmount: number;
    cancellations: readonly {
      amount: number;
      cancelledAt: string;
      reason: string;
      receiptUrl: string | null;
      tid: string;
    }[];
    paymentStatus: "paid" | "partial_cancelled" | "cancelled";
  };

  export function createSiteCheckout(
    client: CBrainSupabaseClient,
    input: CreateSiteCheckoutInput,
  ): Promise<PaymentWithOrder>;
  export function prepareLinkPayCheckout(
    client: CBrainSupabaseClient,
    input: PrepareLinkPayCheckoutInput,
  ): Promise<PaymentWithOrder>;
  export function getLatestPaymentByOrderId(
    client: CBrainSupabaseClient,
    orderId: string,
  ): Promise<PaymentRow | null>;
  export function getPaymentByProviderOrderId(
    client: CBrainSupabaseClient,
    providerOrderId: string,
  ): Promise<PaymentWithOrder | null>;
  export function completePayment(
    client: CBrainSupabaseClient,
    input: CompletePaymentInput,
  ): Promise<PaymentRow>;
  export function recordPaymentOutcome(
    client: CBrainSupabaseClient,
    input: RecordPaymentOutcomeInput,
  ): Promise<PaymentRow>;
  export function reservePaymentRefund(
    client: CBrainSupabaseClient,
    input: ReservePaymentRefundInput,
  ): Promise<RefundRow>;
  export function recordRefundOutcome(
    client: CBrainSupabaseClient,
    input: RecordRefundOutcomeInput,
  ): Promise<RefundRow>;
  export function finalizePaymentRefund(
    client: CBrainSupabaseClient,
    input: FinalizePaymentRefundInput,
  ): Promise<RefundRow>;
  export function syncProviderCancellations(
    client: CBrainSupabaseClient,
    paymentId: string,
    snapshot: ProviderCancellationSnapshot,
  ): Promise<PaymentRow>;
  ```

  `types.ts`는 새 enum/table/RPC를 반영하고 `index.ts`에서 두 파일을 export한다. 기존 `paymentLinks.ts`는 Task 4에서 소비처를 모두 옮긴 뒤 삭제한다.

- [ ] **Step 9: DB·타입·보안 gate를 통과시킨다**

  ```bash
  pnpm exec supabase db reset --local --no-seed
  pnpm exec supabase test db --local
  pnpm exec supabase db advisors --local
  pnpm --filter @repo/supabase test
  pnpm --filter @repo/supabase check-types
  pnpm --filter @repo/supabase lint
  ```

  Expected: 모두 exit 0이며 새 원장 관련 security/performance advisor warning이 0이다.

---

### Task 2: 채널 중립 NICEPAY 결제 코어

**Files:**

- Create: `apps/user/lib/paymentCheckout.ts`
- Modify: `apps/user/lib/nicepay.ts`
- Modify: `apps/user/app/api/payments/nicepay/return/route.ts`
- Modify: `apps/user/app/api/payments/nicepay/webhook/route.ts`
- Create: `apps/user/__tests__/payment-checkout.test.mjs`
- Modify: `apps/user/__tests__/nicepay.test.mjs`
- Modify: `apps/user/__tests__/linkpay-payment.test.mjs`

**Interfaces:**

- Produces `NicepayCheckoutRequest` used by both site and LinkPay.
- Produces `buildNicepayCheckoutRequest(order, payment, config)`.
- Produces `getPaymentResultLocation(order, "success" | "failed" | "pending")`.
- The common return endpoint finds the payment from the signed callback `orderId`; it does not accept a LinkPay token.

- [ ] **Step 1: 두 채널 공통 계약 테스트를 먼저 작성한다**

  ```js
  assert.doesNotMatch(returnRoute, /searchParams\.get\(["']token["']\)/);
  assert.match(returnRoute, /getPaymentByProviderOrderId/);
  assert.match(returnRoute, /getPaymentResultLocation/);
  assert.match(checkoutCore, /order\.channel === "site"/);
  assert.match(checkoutCore, /order\.channel === "linkpay"/);
  assert.match(webhookRoute, /getPaymentByProviderOrderId/);
  ```

  Run: `pnpm --filter user test`

  Expected: `paymentCheckout.ts`가 없고 return이 token에 결합되어 있어 FAIL.

- [ ] **Step 2: 공통 checkout request builder를 구현한다**

  ```ts
  export type NicepayCheckoutRequest = {
    amount: number;
    buyerEmail: string;
    buyerName: string;
    buyerTel: string;
    clientId: string;
    goodsName: string;
    method: "card";
    orderId: string;
    returnUrl: string;
  };
  ```

  `buildNicepayCheckoutRequest`는 `order.amount === payment.amount`, `payment.status === "ready"`, 구매자 필드 존재를 검사하고 공통 return URL `/api/payments/nicepay/return`을 만든다. 브라우저 payload는 인자로 받지 않는다.

- [ ] **Step 3: return route를 payment 중심으로 바꾼다**

  route는 form을 parse한 뒤 callback `orderId`로 `payments.provider_order_id`를 조회한다. DB의 payment/order 금액과 callback 금액, client key, TID, signature를 검증한 뒤 현재 승인→거래조회→망취소 순서를 유지한다.

  ```text
  승인 또는 조회로 paid 증명       → completePayment
  서명된 failed/expired 증명       → recordPaymentOutcome
  승인·조회·망취소 모두 불명확     → recordPaymentOutcome(unknown)
  변조된 callback                  → provider 승인 호출 없이 400
  ```

  저장 후 `order.channel`과 `order.public_token`으로 결과 URL을 정한다.

  ```ts
  const resultPaths = {
    site: {
      success: "/order/success",
      failed: "/order/fail",
      pending: "/order/pending",
    },
    linkpay: {
      success: `/linkpay/${order.public_token}/success`,
      failed: `/linkpay/${order.public_token}/fail`,
      pending: `/linkpay/${order.public_token}/pending`,
    },
  } as const;
  ```

  site URL에는 `token=orders.public_token` query를 붙인다. malformed form처럼 order를 찾을 수 없는 요청은 redirect하지 않고 400을 반환한다.

- [ ] **Step 4: webhook을 channel-neutral하게 만든다**

  webhook은 `payment_links`를 조회하지 않는다. provider `orderId`로 payment+order를 찾고 서명, 금액, TID를 검증한 뒤 같은 `completePayment`/`recordPaymentOutcome`을 호출한다. NICEPAY webhook test의 존재하지 않는 주문은 기존처럼 정확한 `OK`로 응답하되, 알려진 주문의 mismatch는 400이다.

- [ ] **Step 5: 공통 코어 테스트를 통과시킨다**

  다음을 mock 테스트한다.
  - site/linkpay가 같은 return URL과 서로 다른 결과 URL을 사용함.
  - callback orderId가 없는 경우 provider API를 호출하지 않음.
  - DB amount와 callback amount가 다르면 승인하지 않음.
  - 승인 timeout + 조회 실패 + 망취소 실패는 `unknown` 저장.
  - 동일 TID callback과 webhook은 idempotent.
  - cancelled/partialCancelled가 늦은 paid webhook으로 되돌아가지 않음.

  Run:

  ```bash
  pnpm --filter user test
  pnpm --filter user check-types
  pnpm --filter user lint
  ```

  Expected: 모두 exit 0.

---

### Task 3: 사이트 일반 주문 결제 완주

**Files:**

- Modify: `apps/user/app/(site)/order/payment.ts`
- Modify: `apps/user/app/(site)/order/page.tsx`
- Modify: `apps/user/app/(site)/order/OrderCustomerInfoStep.tsx`
- Modify: `apps/user/app/(site)/order/OrderPaymentResult.tsx`
- Modify: `apps/user/app/(site)/order/success/page.tsx`
- Modify: `apps/user/app/(site)/order/fail/page.tsx`
- Create: `apps/user/app/(site)/order/pending/page.tsx`
- Modify: `apps/user/__tests__/order-page.test.mjs`
- Create: `apps/user/__tests__/site-payment.test.mjs`

**Interfaces:**

- `submitOrderPayment(payload)` consumes a stable `requestId` and returns `{ status: "ready", checkout: NicepayCheckoutRequest }` or a verified validation failure.
- `resolveSiteOrderQuote(ids)` returns only server-derived amount, order name, and `SiteOrderSnapshot`.
- The browser invokes `AUTHNICE.requestPay(checkout)` once.

```ts
export type SiteOrderQuote = {
  amount: number;
  orderName: string;
  snapshot: SiteOrderSnapshot;
};

export type OrderPaymentSubmitPayload = {
  agreements: Record<AgreementId, boolean>;
  customer: OrderCustomerInfo;
  requestId: string;
  summary: OrderSelectionSummary;
};
```

- [ ] **Step 1: payment-not-ready 테스트를 실제 checkout 계약으로 바꾼다**

  ```js
  assert.match(paymentAction, /createSiteCheckout/);
  assert.match(paymentAction, /buildNicepayCheckoutRequest/);
  assert.doesNotMatch(paymentAction, /payment-not-ready/);
  assert.match(orderPage, /AUTHNICE\.requestPay/);
  assert.match(orderPage, /checkout/);
  ```

  Run: `pnpm --filter user test`

  Expected: 기존 server action이 `payment-not-ready`를 반환하므로 FAIL.

- [ ] **Step 2: 서버가 사이트 주문 견적과 snapshot을 재구성한다**

  `resolveSiteOrderQuote`는 `serviceId`, `pageId`, `paperId`, `quantityId`, `hasPlanning`만 사용한다. `getOrderOptionConfig`, `getOrderQuantityOptions`, `getDirectServiceItemById`로 유효 옵션을 찾고 다음 값을 서버에서 만든다.

  ```ts
  const amount =
    selectedQuantity.total +
    (ids.hasPlanning ? optionConfig.planningService.fee : 0);

  return {
    amount,
    orderName: service.title,
    snapshot: {
      channel: "site",
      hasPlanning: ids.hasPlanning,
      pageId: selectedPage.id,
      pageLabel: selectedPage.label,
      paperId: selectedPaper.id,
      paperLabel: selectedPaper.label,
      quantityId: selectedQuantity.id,
      quantityLabel: selectedQuantity.quantity,
      schemaVersion: 1,
      serviceId: service.id,
      serviceLabel: service.title,
      unitPrice: selectedQuantity.unitPriceAmount,
    },
  } satisfies SiteOrderQuote;
  ```

  payload의 `summary.totalPrice`, label, unit price는 비교용으로도 의존하지 않는다. 서버에서 option ID를 찾지 못하면 `invalid-product`, 가격표가 없으면 `invalid-price`를 반환한다.

- [ ] **Step 3: server action이 주문과 payment를 만들고 checkout 값을 반환한다**

  request ID가 UUID인지 확인하고 이름 1~30자, 회사명 0~100자, 국내 휴대전화 숫자, 이메일 3~60자, 두 약관 `true`를 서버에서 다시 검증한다. 전화번호는 숫자만 저장하고 `privacy_agreed_at = new Date().toISOString()`을 기록한다.

  고객정보 step은 한 checkout 시도 동안 유지되는 `crypto.randomUUID()`를 만들고 payload의 `requestId`로 전달한다. server action은 `customerLabel = customerCompany.trim() || customerName.trim()`으로 만들고 `createSiteCheckout`에 request ID, server quote, 고객정보를 전달한다. 반환 payment와 연결 order로 `buildNicepayCheckoutRequest`를 호출하며 성공 result에 내부 DB ID는 포함하지 않는다.

- [ ] **Step 4: 기존 결제 버튼을 NICEPAY SDK에 연결한다**

  `page.tsx` 또는 가장 가까운 client component에서 공식 SDK `https://pay.nicepay.co.kr/v1/js/`를 `next/script`로 한 번 로드한다. 중복 submit을 막고 server action 성공 시에만 호출한다.

  ```ts
  const result = await submitOrderPayment(payload);

  if (result.status !== "ready") {
    router.push(result.redirectHref);
    return;
  }

  window.AUTHNICE.requestPay({
    ...result.checkout,
    fnError() {
      setIsSubmitting(false);
    },
  });
  ```

  `Window.AUTHNICE` 최소 타입만 선언하고 SDK wrapper class나 새 상태관리 라이브러리는 만들지 않는다.

- [ ] **Step 5: site success/fail/pending 페이지를 실제 order 상태로 연결한다**

  세 페이지는 `token` query로 server-only `getOrderByPublicToken`을 호출하고 `channel === "site"`인지 확인한다.
  - success: `paid|partially_refunded|refunded`만 성공 UI, 나머지는 pending/fail로 redirect.
  - fail: `open`이면서 최신 payment가 `failed|expired`일 때만 실패 UI. query의 오류 문구를 그대로 출력하지 않는다.
  - pending: `payment_pending`만 “결제 결과 확인 중이며 다시 결제하지 마세요” 표시.

  기존 `OrderPaymentResult`에 `pending` variant를 추가하되 구조와 CSS는 재사용한다.

- [ ] **Step 6: 자동 테스트를 통과시킨다**

  다음을 검증한다.
  - 변조한 브라우저 합계가 payment amount에 반영되지 않음.
  - 존재하지 않는 옵션 조합은 DB row를 만들지 않음.
  - 약관·이름·전화·이메일 누락은 NICEPAY 호출 전에 실패.
  - 같은 requestId의 double click/네트워크 재시도는 같은 payment를 반환하고 `requestPay`를 한 번만 실행.
  - site order의 success URL이 LinkPay URL로 가지 않음.
  - pending 화면에 재결제 버튼이 없음.

  Run:

  ```bash
  pnpm --filter user test
  pnpm --filter user check-types
  pnpm --filter user lint
  pnpm --filter user build
  ```

  Expected: 모두 exit 0.

- [ ] **Step 7: 첫 번째 수동 체크포인트로 사이트 결제를 검증한다**

  NICEPAY sandbox에서 현재 카탈로그의 한 상품을 선택해 결제한다.
  1. 브라우저 표시 합계와 server-created `orders.amount`가 같다.
  2. `orders.channel = site`, snapshot에 선택 옵션이 기록된다.
  3. NICEPAY 결제창 금액이 DB payment amount와 같다.
  4. 승인 후 order/payment가 각각 `paid`가 된다.
  5. `/order/success?token=...`이 실제 주문 내용을 표시한다.

  이 체크포인트가 통과하기 전에는 LinkPay 마이그레이션을 진행하지 않는다.

---

### Task 4: LinkPay를 같은 주문·결제 파이프라인으로 이동

**Files:**

- Modify: `apps/admin/src/pages/LinkPayPage.tsx`
- Modify: `apps/admin/src/pages/LinkPayFormPage.tsx`
- Modify: `apps/admin/src/pages/linkPayData.ts`
- Modify: `apps/admin/tests/linkPayData.test.mjs`
- Modify: `apps/admin/tests/linkPayFormPage.test.mjs`
- Modify: `apps/admin/tests/linkPayPage.test.mjs`
- Modify: `apps/user/app/(site)/linkpay/[id]/page.tsx`
- Modify: `apps/user/app/(site)/linkpay/[id]/LinkPayPaymentForm.tsx`
- Delete: `apps/user/app/(site)/linkpay/[id]/payment.ts`
- Delete: `apps/user/app/_content/linkPay.ts`
- Modify: `apps/user/app/(site)/linkpay/[id]/success/page.tsx`
- Modify: `apps/user/app/(site)/linkpay/[id]/fail/page.tsx`
- Create: `apps/user/app/(site)/linkpay/[id]/pending/page.tsx`
- Modify: `apps/user/app/api/linkpay/[publicToken]/order/route.ts`
- Modify: `apps/user/__tests__/linkpay-page.test.mjs`
- Modify: `apps/user/__tests__/linkpay-payment.test.mjs`
- Delete: `packages/supabase/src/paymentLinks.ts`

**Interfaces:**

- Admin LinkPay CRUD reads/writes `orders where channel = "linkpay"`.
- `POST /api/linkpay/:publicToken/order` consumes only `{ customer, agreements }` and returns `NicepayCheckoutRequest`.
- LinkPay and site payment share Task 2 return/webhook code without channel branches outside result routing.

- [ ] **Step 1: 관리자 LinkPay 테스트를 새 order helper 이름으로 바꾼다**

  ```js
  assert.match(pageSource, /listAdminLinkPayOrders/);
  assert.match(formSource, /createLinkPayOrder/);
  assert.match(formSource, /updateOpenLinkPayOrder/);
  assert.match(formSource, /deleteOpenLinkPayOrder/);
  assert.doesNotMatch(pageSource + formSource, /PaymentLink/);
  ```

  Run: `pnpm --filter admin test`

  Expected: 기존 paymentLinks helper를 사용하므로 FAIL.

- [ ] **Step 2: LinkPay form 값을 order row와 snapshot으로 변환한다**

  ```ts
  export function toLinkPayOrderInput(
    form: LinkPayFormState,
  ): LinkPayOrderInput {
    const amountText = form.amount.replaceAll(",", "");
    const amount = Number(amountText);
    const category = form.category.trim();
    const customerLabel = form.client.trim();
    const orderName = form.paymentName.trim();
    const pageQuantity = form.pageQuantity.trim();
    const paper = form.paper.trim();
    const service = form.service.trim();

    if (
      !/^\d+$/.test(amountText) ||
      !Number.isSafeInteger(amount) ||
      amount < 1 ||
      amount > 999_999_999_999 ||
      [category, customerLabel, orderName, pageQuantity, paper, service].some(
        (value) => value.length === 0,
      )
    ) {
      throw new Error("링크페이 정보를 확인해주세요.");
    }

    return {
      amount,
      customer_label: customerLabel,
      item_snapshot: {
        category,
        channel: "linkpay",
        pageQuantity,
        paper,
        schemaVersion: 1,
        service,
      },
      order_name: orderName,
    };
  }
  ```

  list status는 `orders.open = 결제전`, `paid|partially_refunded|refunded = 결제완료`, `payment_pending = 확인중`으로 표시한다. 기존 링크 복사는 `orders.public_token`을 그대로 사용한다.

- [ ] **Step 3: 공개 LinkPay 페이지의 fixture를 제거한다**

  page/success/fail/pending은 `getOrderByPublicToken`으로 `channel === "linkpay"`를 확인한다. `item_snapshot`을 parse해 기존 상세 row로 변환한다. invalid shape는 결제 버튼을 표시하지 않고 404 처리한다.

  `open`만 결제 form을 보여준다. `payment_pending`은 pending 화면, 승인·환불 상태는 success 화면으로 보낸다.

- [ ] **Step 4: LinkPay order endpoint가 공통 payment를 준비한다**

  body의 고객정보와 약관을 Task 3과 동일한 validator로 검증한다. route는 public token으로 order를 찾고 `prepareLinkPayCheckout`을 호출한 뒤 Task 2 builder를 반환한다. body의 amount, orderId, returnUrl, status는 읽지 않는다.

  응답 상태는 invalid body 400, 없는 token 404, pending/paid/refunded 409, server/provider config 500으로 고정한다.

- [ ] **Step 5: LinkPay form이 같은 NICEPAY 호출을 사용한다**

  기존 form validation 뒤 endpoint를 호출하고 `AUTHNICE.requestPay(response)`를 실행한다. site와 동일한 client helper를 추출할 필요가 생기더라도 두 component에서 10줄 이하 호출이 중복되는 동안은 새 hook을 만들지 않는다.

- [ ] **Step 6: LinkPay 자동·수동 체크포인트를 통과시킨다**

  자동 테스트:
  - fixture import가 없음.
  - admin open LinkPay만 수정·삭제 가능.
  - 브라우저 amount가 무시되고 order amount만 NICEPAY에 전달됨.
  - unknown LinkPay는 409이며 결제 버튼이 없음.
  - callback 결과가 `/linkpay/:token/...`으로 돌아감.

  Run:

  ```bash
  pnpm --filter @repo/supabase test
  pnpm --filter admin test
  pnpm --filter admin build
  pnpm --filter user test
  pnpm --filter user build
  ```

  수동 sandbox에서는 1,004원 LinkPay 생성 → URL 복사 → 고객 결제 → `orders.channel = linkpay` → 공통 `payments.paid` → success 화면을 확인한다.

---

### Task 5: 두 채널 통합 매출 조회

**Files:**

- Create: `packages/supabase/src/sales.ts`
- Modify: `packages/supabase/src/index.ts`
- Create: `packages/supabase/tests/sales.test.mjs`
- Modify: `apps/admin/src/pages/salesData.ts`
- Modify: `apps/admin/src/pages/SalesPage.tsx`
- Modify: `apps/admin/src/components/admin-sales/SalesSummaryCards.tsx`
- Modify: `apps/admin/src/components/admin-sales/SalesTrendChart.tsx`
- Modify: `apps/admin/src/components/admin-sales/SalesTransactionsTable.tsx`
- Modify: `apps/admin/tests/salesData.test.mjs`

**Interfaces:**

- `getAdminSalesDashboard(client, { channel, from, to }) -> SalesDashboardData`.
- `channel`은 `"all" | "site" | "linkpay"`.
- `SalesSummary = { grossSalesAmount, paymentCount, refundedAmount, netSalesAmount }`.
- 표의 event는 `kind: "payment" | "refund"`이고 order channel을 포함한다.

```ts
export type SalesSummary = {
  grossSalesAmount: number;
  netSalesAmount: number;
  paymentCount: number;
  refundedAmount: number;
};

type SalesEventBase = {
  amount: number;
  channel: OrderChannel;
  customerLabel: string;
  occurredAt: string;
  orderId: string;
  orderName: string;
  paymentId: string;
  receiptUrl: string | null;
  refundableAmount: number;
};

export type SalesEvent = SalesEventBase &
  (
    | {
        kind: "payment";
        status: "paid" | "partial_cancelled" | "cancelled" | "unknown";
      }
    | { kind: "refund"; status: "succeeded" | "unknown" }
  );

export type SalesDashboardData = {
  events: readonly SalesEvent[];
  summary: SalesSummary;
};
```

- [ ] **Step 1: fixture 테스트를 실제 event 계산 계약으로 바꾼다**

  ```js
  const summary = summarizeSalesEvents([
    { amount: 10000, channel: "site", kind: "payment", status: "paid" },
    { amount: 7000, channel: "linkpay", kind: "payment", status: "paid" },
    { amount: 4000, channel: "site", kind: "refund", status: "succeeded" },
    { amount: 9000, channel: "site", kind: "payment", status: "unknown" },
  ]);

  assert.deepEqual(summary, {
    grossSalesAmount: 17000,
    paymentCount: 2,
    refundedAmount: 4000,
    netSalesAmount: 13000,
  });
  ```

  Run: `pnpm --filter admin test`

  Expected: 실제 event helper가 없어 FAIL.

- [ ] **Step 2: 승인·환불 event read model을 구현한다**

  payments query는 `paid_at` 기간 안의 `paid|partial_cancelled|cancelled`와 `created_at` 기간 안의 `unknown`을 orders와 join한다. refunds query는 `refunded_at` 기간 안의 `succeeded`와 `requested_at` 기간 안의 `unknown`을 payment/order와 join한다. 승인 payment와 성공 refund만 summary에 포함하고, unknown은 표와 상태 확인 동작에만 포함한다. refund 금액은 UI에서만 음수로 표시한다.

  `channel !== all`이면 두 query 모두 `orders.channel`을 같은 값으로 필터한다. 날짜는 `YYYY-MM-DD`, KST 시작 inclusive, 종료 다음 날 exclusive로 변환하며 최대 366일만 허용한다.

- [ ] **Step 3: 매출 UI를 실제 지표와 채널 필터로 교체한다**

  summary 카드 순서는 기간 순매출, 총 승인액, 결제 건수, 환불액이다. table 열은 다음으로 고정한다.

  ```text
  채널 | 구분 | 상태 | 주문명 | 고객 | 거래일자 | 거래금액 | 환불가능액 | 영수증 | 환불
  ```

  `cardFee`, `settlementAmount`, `scheduled`, `settled`, `monthlyVisitorCount`, fixture preview와 `applyLocalRefund`를 제거한다. 상태는 결제완료, 부분환불, 환불완료, 확인중만 사용한다.

- [ ] **Step 4: 실제 데이터 로드와 테스트를 완료한다**

  기본 기간은 오늘 포함 최근 30일, 기본 channel은 all이다. loading/empty/error를 기존 페이지 영역 안에 표시한다.

  다음을 테스트한다.
  - site 1건 + linkpay 1건이 all 합계에 포함됨.
  - site filter는 LinkPay event를 제외함.
  - 기간 밖 승인 거래의 기간 내 환불은 그 기간 환불액에 포함됨.
  - 환불가능액 0인 row에는 환불 버튼이 없음.
  - 화면에 예정 정산 금액과 카드수수료가 없음.

  Run:

  ```bash
  pnpm --filter @repo/supabase test
  pnpm --filter admin test
  pnpm --filter admin build
  pnpm --filter admin lint
  ```

  수동 확인에서 Task 3 site 승인과 Task 4 LinkPay 승인이 각각 올바른 채널과 금액으로 나타나야 한다.

---

### Task 6: 공통 전액·부분환불

**Files:**

- Modify: `apps/user/lib/nicepay.ts`
- Create: `apps/user/app/api/admin/payments/[paymentId]/refund/route.ts`
- Create: `apps/user/lib/adminPaymentAuth.ts`
- Create: `apps/admin/src/lib/paymentApi.ts`
- Modify: `apps/admin/src/pages/SalesPage.tsx`
- Modify: `apps/admin/src/components/admin-sales/RefundDialog.tsx`
- Modify: `apps/admin/src/pages/salesData.ts`
- Modify: `apps/user/__tests__/nicepay.test.mjs`
- Create: `apps/user/__tests__/payment-refund.test.mjs`
- Modify: `apps/admin/tests/salesData.test.mjs`

**Interfaces:**

- `POST /api/admin/payments/:paymentId/refund` consumes `{ requestId, amount, reason }`.
- Success: HTTP 200 `{ status: "succeeded", refundedAmount, refundableAmount }`.
- 불명: HTTP 202 `{ status: "unknown" }`.
- 검증된 거절/초과: HTTP 409 `{ status: "failed", error }`.

- [ ] **Step 1: NICEPAY cancel client 테스트를 먼저 작성한다**

  취소 응답의 `cancelledTid`, `balanceAmt`, `cancels`, `card.canPartCancel` parse와 signature 검증을 테스트한다. 전액취소 body에는 `cancelAmt`가 없고 부분취소 body에는 정수 금액이 있는지 검사한다.

  Run: `pnpm --filter user test`

  Expected: `cancelNicepayPayment`가 없어 FAIL.

- [ ] **Step 2: 취소 helper를 구현한다**

  ```ts
  export async function cancelNicepayPayment(
    config: NicepayConfig,
    tid: string,
    input: {
      amount: number;
      fullAmount: number;
      orderId: string;
      reason: string;
    },
  ): Promise<NicepayPayment>;
  ```

  `POST /v1/payments/{tid}/cancel`을 호출하고 `amount === fullAmount`이면 `cancelAmt`를 생략한다. 원 TID, 원 결제금액, response signature, `balanceAmt`, `cancelledTid`를 검증한다. 부분환불은 DB의 `can_part_cancel = true`일 때만 요청한다.

- [ ] **Step 3: 관리자 인증과 Origin 검증을 구현한다**

  `adminPaymentAuth.ts`는 다음 순서만 허용한다.
  1. `Origin === ADMIN_APP_URL`.
  2. 단일 `Authorization: Bearer <token>`.
  3. publishable server client의 `auth.getUser(token)`으로 현재 user 검증.
  4. `user.app_metadata.role === "admin"`.

  secret client는 인증이 끝난 뒤 DB RPC에만 사용한다. CORS `OPTIONS`는 허용 origin에만 `POST, OPTIONS`와 `Authorization, Content-Type`을 반환한다.

- [ ] **Step 4: DB 예약 → NICEPAY 취소 → DB 확정 순서로 route를 구현한다**

  ```text
  input 검증
    → reservePaymentRefund(requestId)
    → 기존 succeeded/unknown이면 provider 재호출 없이 반환
    → cancelNicepayPayment(original TID)
    → signed response와 balanceAmt 검증
    → finalizePaymentRefund
  ```

  timeout 후 거래 조회에서도 취소 사실을 확인할 수 없으면 `recordRefundOutcome(..., status: "unknown")`을 호출하고 202를 반환한다. 검증된 provider 거절은 같은 helper로 `failed`를 기록한다. unknown 금액은 계속 예약되므로 추가 환불이 차단된다.

- [ ] **Step 5: RefundDialog를 실제 API에 연결한다**

  admin client는 현재 Supabase session token을 Authorization header에 넣는다. dialog은 열릴 때 `crypto.randomUUID()`를 한 번 만들고 같은 제출 재시도에 재사용한다. 최대값은 `refundableAmount`, 사유는 1~100자다. 성공 시 dashboard를 reload하고 202이면 성공 문구 대신 “환불 결과 확인 중”을 표시한다.

- [ ] **Step 6: 두 채널에서 동일한 환불 계약을 테스트한다**
  - 인증 없음 401, non-admin 403, 잘못된 Origin 403.
  - 같은 requestId 두 번은 NICEPAY 호출 한 번.
  - 10,000원에서 4,000원 환불 후 balance 6,000원.
  - 나머지 6,000원 환불 후 balance 0원.
  - 부분취소 불가 카드의 4,000원 요청은 provider 호출 전 409.
  - timeout은 unknown/202이고 추가 환불을 차단.
  - site와 linkpay payment가 같은 endpoint와 RPC를 사용.

  Run:

  ```bash
  pnpm exec supabase test db --local
  pnpm --filter user test
  pnpm --filter user check-types
  pnpm --filter admin test
  pnpm --filter admin build
  ```

  수동 sandbox에서는 site 결제 한 건을 부분→전액환불하고 LinkPay 결제 한 건을 전액환불한다. 각 채널의 순매출과 환불가능액이 즉시 갱신되어야 한다.

---

### Task 7: 웹훅 재조정과 출시 gate

**Files:**

- Modify: `apps/user/app/api/payments/nicepay/webhook/route.ts`
- Create: `apps/user/app/api/admin/payments/[paymentId]/reconcile/route.ts`
- Modify: `apps/admin/src/lib/paymentApi.ts`
- Modify: `apps/admin/src/pages/SalesPage.tsx`
- Modify: `apps/admin/src/components/admin-sales/SalesTransactionsTable.tsx`
- Modify: `apps/user/__tests__/payment-checkout.test.mjs`
- Modify: `apps/user/__tests__/payment-refund.test.mjs`
- Create: `docs/nicepay-unified-payments-runbook.md`
- Modify: `apps/user/.env.example`
- Modify: `apps/admin/.env.example`

**Interfaces:**

- Verified webhook synchronizes the shared payment and refund ledger for both channels.
- `POST /api/admin/payments/:paymentId/reconcile` only retrieves provider state; it never re-approves or re-cancels.
- unknown sales rows expose “상태 확인” and do not expose refund.
- `syncProviderCancellations(client, paymentId, snapshot)` upserts verified external cancels by `nicepay_cancelled_tid` and updates the remaining balance monotonically.

`apps/user`가 검증된 `NicepayPayment`를 이 DTO로 변환하며 `@repo/supabase`가 app 타입을 import하지 않는다.

- [ ] **Step 1: provider 밖 취소와 늦은 webhook 테스트를 작성한다**

  다음을 검증한다.
  - 서명되지 않은 cancelled/partialCancelled webhook은 400.
  - 검증된 `cancels`는 `nicepay_cancelled_tid` 기준 중복 없이 refunds에 기록.
  - NICEPAY 관리자에서 발생한 취소는 `origin = provider`, `requested_by = null`.
  - 늦은 paid webhook은 partial_cancelled/cancelled를 되돌리지 않음.
  - site/linkpay 어느 channel도 별도 webhook 분기를 사용하지 않음.

- [ ] **Step 2: webhook이 잔액과 외부 환불을 단조롭게 동기화한다**

  provider 조회 결과의 `cancels` 배열을 취소 TID로 upsert한다. 내부 request ID가 없는 외부 취소에는 새 UUID request ID와 `RFWEBHOOK{cancelledTid}` provider refund order ID를 사용한다. provider `balanceAmt`가 기존 값보다 증가하거나 성공 환불 누계와 모순되면 자동 덮어쓰지 않고 payment를 `unknown`으로 잠근다.

- [ ] **Step 3: 단일 payment 재확인 endpoint를 구현한다**

  Task 6 관리자 인증을 재사용한다. NICEPAY 거래 조회 후 다음만 수행한다.
  - verified paid: 승인 완료 또는 현재 balance/cancel 목록 동기화.
  - verified failed/expired: unresolved payment를 해당 상태로 확정.
  - verified cancelled/partialCancelled: refund 목록과 balance 동기화.
  - 여전히 불명: DB를 바꾸지 않고 HTTP 202.

  승인 API와 취소 API는 호출하지 않는다.

- [ ] **Step 4: 관리자 상태 확인 동작을 연결한다**

  unknown payment/refund row는 환불 버튼 대신 `상태 확인`을 표시한다. reconcile 성공 후 dashboard를 다시 조회하고 202이면 “아직 NICEPAY에서 결과를 확인할 수 없습니다.”를 표시한다.

- [ ] **Step 5: 환경변수와 운영 runbook을 확정한다**

  `apps/user/.env.example`:

  ```dotenv
  NEXT_PUBLIC_SITE_URL=
  NICEPAY_MODE=sandbox
  NEXT_PUBLIC_NICEPAY_CLIENT_KEY=
  NICEPAY_SECRET_KEY=
  ADMIN_APP_URL=http://localhost:5173
  ```

  `apps/admin/.env.example`:

  ```dotenv
  VITE_SUPABASE_URL=
  VITE_SUPABASE_PUBLISHABLE_KEY=
  VITE_USER_APP_URL=http://localhost:3000
  ```

  runbook에는 sandbox/production key 전환, return URL, webhook URL, 정확한 `OK` acknowledgement, site/LinkPay 소액 결제, 결과 불명 대응, 부분·전액환불, DB와 NICEPAY TID 대조 절차를 기록한다.

- [ ] **Step 6: 전체 자동 gate를 실행한다**

  ```bash
  pnpm exec supabase db reset --local --no-seed
  pnpm exec supabase test db --local
  pnpm exec supabase db advisors --local
  pnpm --filter @repo/supabase test
  pnpm --filter @repo/supabase check-types
  pnpm --filter @repo/supabase lint
  pnpm --filter user test
  pnpm --filter user check-types
  pnpm --filter user lint
  pnpm --filter user build
  pnpm --filter admin test
  pnpm --filter admin build
  pnpm --filter admin lint
  rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages
  ```

  Expected: 모든 test/type/lint/build/advisor 명령이 통과하고 마지막 검색은 무출력이다.

- [ ] **Step 7: 운영 go/no-go를 두 채널 각각 수행한다**

  production HTTPS에서 허용되는 최소 금액으로 site 1건과 LinkPay 1건을 결제한다. 각 거래에 대해 callback, webhook, 매출 반영, 부분 또는 전액환불, refund webhook, 최종 순매출을 같은 provider order ID/TID/cancelled TID로 대조한다.

  다음 중 하나라도 발생하면 출시하지 않는다.
  - 브라우저 금액과 DB/NICEPAY 승인금액 불일치.
  - site 결과가 LinkPay URL로 가거나 반대 channel로 표시됨.
  - callback/webhook 서명 검증 실패.
  - unknown 상태에서 재결제 또는 추가 환불 가능.
  - 동일 request ID의 provider 중복 호출.
  - 환불 성공 후 balance 또는 매출 지표 미반영.
  - NICEPAY 관리자 거래와 DB 원장 불일치.

## Deferred Scope

- 관리자 상품 DB와 사이트 주문 카탈로그의 실시간 연결. 현재 사이트가 사용하는 정적 카탈로그를 서버도 같은 resolver로 사용한다.
- NICEPAY 정산·입금 대사, 실제 카드 수수료, 정산 예정액.
- 회계 분개, 세금계산서, 부가세 신고 자료.
- 자동 cron reconciliation. 1차는 웹훅과 관리자 단건 재확인만 제공한다.
- 카드 외 결제수단과 복수 PG.
- 주문 제작·배송·디자이너 배정 같은 결제 이후 fulfillment 상태.
- 원본 provider payload event store. 1차는 검증된 최종 필드만 보관한다.

## Reference Documents

- NICEPAY Server 승인: `https://start.nicepay.co.kr/manual/quickguide/overview.do`
- NICEPAY 취소·부분취소·망취소: `https://github.com/nicepayments/nicepay-manual/blob/main/api/cancel.md`
- Supabase Data API security: `https://supabase.com/docs/guides/api/securing-your-api`
- Supabase 2026 explicit GRANT change: `https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically`
- Flow diagram: `docs/superpowers/plans/2026-08-09-unified-payments-sales-refunds.workflow.html`
