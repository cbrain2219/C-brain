# Reusable LinkPay and Unified Payments, Sales, and Partial Refunds MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** 사이트 일반 결제와 공개 재사용형 LinkPay가 하나의 NICEPAY 원장을 사용하고, 같은 LinkPay로 여러 고객이 독립 결제하며, 관리자가 결제별 부분·전액환불과 순매출을 처리할 수 있게 한다.

**Architecture:** payment_links는 결제 상태가 없는 재사용 템플릿이다. 고객이 결제를 제출할 때마다 서버가 링크 또는 사이트 상품 정보를 orders에 스냅샷하고 독립 payments를 만든다. 승인·환불 원장은 payments와 refunds가 담당하며 매출은 두 테이블을 조회해 계산하고 별도 sales 테이블이나 DB view를 만들지 않는다.

**Tech Stack:** React 19, Next.js 16 App Router, Vite admin, TypeScript 5.9, Supabase/PostgreSQL, NICEPAY JS SDK 및 Server 승인·조회·취소 API

## Execution Override

- DB schema와 migration SQL의 작성·적용은 프로젝트 소유자가 직접 수행한다.
- 구현 에이전트는 Docker를 시작하거나 로컬·원격 Supabase DB에 접속하지 않고, `supabase/migrations`와 `supabase/tests`도 수정하지 않는다.
- 아래 Task 1의 SQL은 애플리케이션 타입과 RPC 호출을 맞추기 위한 계약 참고용이다. 이번 실행에서는 `packages/supabase`의 타입·wrapper와 이후 애플리케이션 작업만 수행한다.

## Implementation Status (2026-08-09)

- 애플리케이션 구현 완료: 재사용 LinkPay, 사이트 일반 결제, 공통 NICEPAY 승인·결과, 매출 조회, 부분·전액환불, 취소 웹훅, 수동 reconciliation.
- 자동 검증 완료: 전체 test, typecheck, lint, build. SQL contract test 한 건은 DB 소유자 작업으로 명시적으로 skip한다.
- DB 적용 대기: 네 테이블·다섯 RPC와 `reserve_refund.should_execute`를 담은 migration은 작성되었고, 소유자가 검토 후 직접 실행한다.
- 운영 검증 대기: SQL 적용 후 NICEPAY sandbox 수동 시나리오와 DB 원자성/RLS 검증을 수행한다.

## Global Constraints

- 기존 결제 데이터가 개발용이고 삭제 가능하다는 전제에서만 기존 결제 migration을 교체한다. 보존할 거래가 한 건이라도 있으면 DB reset을 중단하고 forward migration을 별도로 작성한다.
- 1차 결제수단은 KRW 카드만 지원한다. 계좌이체, 가상계좌, 간편결제, 정기결제, 정산 예정액과 카드 수수료는 범위 밖이다.
- LinkPay URL은 로그인 없이 누구나 열 수 있다. disabled_at이 있는 링크도 안내 화면은 열리지만 새 결제는 만들 수 없다.
- payment_links는 결제 성공·실패·환불로 변경되지 않는다. 링크의 유효 상태는 disabled_at 하나로만 결정한다.
- LinkPay Form 제출마다 새 checkout_request_id를 사용해 독립 Order와 첫 Payment를 만든다. 같은 checkout_request_id 재호출은 같은 거래를 반환한다.
- 일반 주문 금액은 서버 카탈로그로 다시 계산한다. LinkPay 금액과 설명은 서버가 payment_links에서 읽어 orders.item_snapshot에 복사한다.
- 브라우저가 보낸 amount, provider order ID, 상태, 결과 URL은 신뢰하지 않는다.
- 승인 결과가 불명확하면 해당 Payment만 unknown으로 잠근다. 같은 LinkPay의 다른 고객 결제는 계속 허용한다.
- 부분환불은 필수다. 환불 누계와 NICEPAY balanceAmt가 일치해야 하며, 환불 하나가 unknown이면 같은 Payment의 추가 환불만 잠근다.
- 매출은 검증된 승인액, 환불은 검증된 성공 취소액, 순매출은 두 값의 차이다.
- provider_order_id, NICEPAY TID, 환불 request_id, 환불 orderId, cancelledTid는 각각 고유해야 한다.
- secret/service-role 키와 NICEPAY secret key는 서버에서만 사용한다. 고객정보와 전체 provider payload를 로그에 남기지 않는다.
- public 스키마의 네 테이블은 RLS와 명시적 GRANT를 같은 migration에서 설정한다. anon은 테이블을 직접 읽지 않는다.
- UI를 수정하기 전에 design.md를 읽고 기존 typography, icon, asset, component 규칙을 유지한다.
- 요청 전에는 커밋·푸시·배포·원격 DB 쓰기를 하지 않는다.

---

## Target Flow and Data Contract

- [통합 workflow](./2026-08-09-unified-payments-sales-refunds.workflow.html)
- [통합 ERD](./2026-08-09-unified-payments-sales-refunds.erd.html)

ERD에는 실제 테이블 네 개만 표시한다. 매출은 별도 table이나 materialized view 없이 packages/supabase/src/sales.ts에서 payments와 refunds 두 조회를 합쳐 계산한다.

~~~text
payment_links 1 ── N orders 1 ── N payments 1 ── N refunds

site order:    orders.payment_link_id IS NULL
LinkPay order: orders.payment_link_id IS NOT NULL
~~~

### 상태 규칙

~~~text
effective LinkPay state
  disabled_at IS NOT NULL       → disabled
  otherwise                     → active

orders.open
  └─ Payment 생성 → orders.payment_pending + payments.ready
       ├─ 확정 실패/만료 → orders.open + payments.failed|expired
       ├─ 결과 불명 → orders.payment_pending + payments.unknown
       └─ 승인 성공 → orders.paid + payments.paid
            ├─ 일부 취소 → orders.partially_refunded + payments.partial_cancelled
            └─ 잔액 전부 취소 → orders.refunded + payments.cancelled
~~~

- 한 Order에는 ready, unknown, paid, partial_cancelled, cancelled 중 최대 한 Payment만 존재한다.
- failed 또는 expired Payment 뒤에는 같은 Order에 새 Payment를 만들 수 있다.
- 한 Payment에는 성공한 부분환불 여러 건이 존재할 수 있다.
- refunds의 requested 또는 unknown 예약액과 성공 환불 누계는 payment.balance_amount를 초과할 수 없다.
- refunded Order와 cancelled Payment는 다시 결제하거나 환불하지 않는다.

---

### Task 1: 재사용 링크와 통합 거래 원장

**Files:**

- Delete after local-data verification: supabase/migrations/20260722000000_create_payment_links.sql
- Delete after local-data verification: supabase/migrations/20260723000000_add_payment_link_details.sql
- Delete after local-data verification: supabase/migrations/20260723000001_create_payment_orders.sql
- Delete after local-data verification: supabase/migrations/20260723000002_allow_admin_payment_link_delete.sql
- Create: supabase/migrations/20260810021018_create_reusable_unified_payment_ledger.sql
- Create: supabase/tests/reusable_unified_payment_ledger.sql
- Replace: packages/supabase/tests/payment-links-contract.test.mjs
- Modify: packages/supabase/src/types.ts

**Interfaces:**

- Produces OrderChannel = "site" | "linkpay".
- Produces OrderStatus = "open" | "payment_pending" | "paid" | "partially_refunded" | "refunded".
- Produces PaymentStatus = "ready" | "unknown" | "paid" | "failed" | "partial_cancelled" | "cancelled" | "expired".
- Produces RefundStatus = "requested" | "unknown" | "succeeded" | "failed".
- Produces SQL RPCs create_site_checkout, create_linkpay_checkout, finish_payment, reserve_refund, finish_refund.

- [ ] **Step 1: 삭제 가능한 로컬 데이터인지 확인한다**

Run:

~~~bash
pnpm dlx supabase@2.113.0 status
pnpm dlx supabase@2.113.0 migration list --local
~~~

로컬 DB가 실행 중이면 다음 결과를 작업 기록에 남긴다.

~~~sql
select
  (select count(*) from public.payment_links) as payment_links,
  (select count(*) from public.payment_orders) as payment_orders;
~~~

Expected: 보존할 결제가 0건이라는 확인 후에만 기존 네 migration을 삭제한다.

- [ ] **Step 2: 새 원장 계약 테스트를 먼저 실패시킨다**

packages/supabase/tests/payment-links-contract.test.mjs가 새 migration을 읽고 다음 핵심 계약을 검사하게 바꾼다.

~~~js
for (const contract of [
  "create table public.payment_links",
  "create table public.orders",
  "create table public.payments",
  "create table public.refunds",
  "create function public.create_site_checkout",
  "create function public.create_linkpay_checkout",
  "create function public.finish_payment",
  "create function public.reserve_refund",
  "create function public.finish_refund",
]) {
  assert.match(migration, new RegExp(contract.replaceAll(".", "\\.")));
}

assert.doesNotMatch(migration, /create table public\.sales/);
assert.doesNotMatch(migration, /create (?:materialized )?view public\.sales/);
assert.doesNotMatch(migration, /payment_link_status[\s\S]*paid/);
assert.doesNotMatch(migration, /payment_link_id uuid not null unique/);
~~~

Run: pnpm --filter @repo/supabase test

Expected: 새 migration이 없어서 FAIL.

- [ ] **Step 3: 네 테이블과 고유성 제약을 만든다**

새 migration의 테이블 계약을 다음으로 고정한다.

~~~sql
create type public.order_channel as enum ('site', 'linkpay');
create type public.order_status as enum (
  'open', 'payment_pending', 'paid', 'partially_refunded', 'refunded'
);
create type public.payment_status as enum (
  'ready', 'unknown', 'paid', 'failed',
  'partial_cancelled', 'cancelled', 'expired'
);
create type public.refund_status as enum (
  'requested', 'unknown', 'succeeded', 'failed'
);

create table public.payment_links (
  id uuid primary key default gen_random_uuid(),
  public_token uuid not null unique default gen_random_uuid(),
  client_name text not null check (char_length(trim(client_name)) between 1 and 100),
  payment_name text not null check (char_length(trim(payment_name)) between 1 and 100),
  amount bigint not null check (amount between 1 and 999999999999),
  category text not null check (char_length(trim(category)) between 1 and 100),
  service text not null check (char_length(trim(service)) between 1 and 100),
  paper text not null check (char_length(trim(paper)) between 1 and 100),
  page_quantity text not null check (char_length(trim(page_quantity)) between 1 and 100),
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
  customer_label text not null check (char_length(trim(customer_label)) between 1 and 100),
  order_name text not null check (char_length(trim(order_name)) between 1 and 100),
  amount bigint not null check (amount between 1 and 999999999999),
  currency text not null default 'KRW' check (currency = 'KRW'),
  item_snapshot jsonb not null check (jsonb_typeof(item_snapshot) = 'object'),
  buyer_name text not null check (char_length(trim(buyer_name)) between 1 and 30),
  buyer_company text check (buyer_company is null or char_length(trim(buyer_company)) <= 100),
  buyer_phone text not null check (buyer_phone ~ '^01[016789][0-9]{7,8}$'),
  buyer_email text not null check (char_length(trim(buyer_email)) between 3 and 60),
  privacy_agreed_at timestamptz not null,
  status public.order_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (channel = 'site' and payment_link_id is null)
    or (channel = 'linkpay' and payment_link_id is not null)
  ),
  check (item_snapshot ->> 'channel' = channel::text)
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
  updated_at timestamptz not null default now()
);

create unique index payments_one_blocking_attempt_per_order
  on public.payments (order_id)
  where status in ('ready', 'unknown', 'paid', 'partial_cancelled', 'cancelled');

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete restrict,
  request_id uuid not null unique,
  provider_refund_order_id text not null unique
    check (provider_refund_order_id ~ '^[A-Za-z0-9_-]{1,64}$'),
  amount bigint not null check (amount > 0),
  reason text not null check (char_length(trim(reason)) between 1 and 100),
  status public.refund_status not null default 'requested',
  requested_by uuid not null,
  nicepay_cancelled_tid text unique,
  result_code text,
  result_message text,
  receipt_url text,
  requested_at timestamptz not null default now(),
  refunded_at timestamptz,
  updated_at timestamptz not null default now()
);
~~~

orders(channel, created_at), payments(paid_at), refunds(payment_id), refunds(refunded_at)에 index를 추가하고 네 테이블에 공용 updated_at trigger를 적용한다.

- [ ] **Step 4: 다섯 RPC의 transaction 계약을 구현한다**

정확한 함수 책임은 다음과 같다.

~~~text
create_site_checkout
  server-calculated snapshot + customer + checkout_request_id
  → Order(site) + Payment(ready)를 한 transaction에서 생성

create_linkpay_checkout
  public_token으로 Link를 잠그고 disabled_at 검사
  → Link 내용을 snapshot한 Order(linkpay) + Payment(ready) 생성
  → Link row는 변경하지 않음

동일 checkout_request_id
  ready|unknown|paid|partial_cancelled|cancelled → 기존 Order/Payment 반환
  failed|expired → 같은 Order에 새 Payment 생성

finish_payment
  provider_order_id로 Order/Payment 잠금
  paid → TID, amount, balance, paidAt 검증 후 Order와 Payment 동시 확정
  failed|expired → Order open
  unknown → Order payment_pending

reserve_refund
  Payment와 기존 Refund를 잠금
  amount <= balance_amount
  requested + unknown 예약액 합계가 balance_amount 이하
  같은 request_id면 기존 Refund와 should_execute = false를 반환
  새 예약을 이번 호출이 원자적으로 생성/claim한 경우에만 should_execute = true를 반환
  should_execute = true인 호출만 NICEPAY 취소를 실행한다

finish_refund
  succeeded → cancelledTid와 provider balance 검증 후 잔액/상태 동시 갱신
  failed → 예약 해제
  unknown → 예약 유지
~~~

모든 RPC는 SECURITY INVOKER, SET search_path = public을 사용한다. PUBLIC, anon, authenticated의 execute 권한을 revoke하고 service_role에만 grant한다.

- [ ] **Step 5: RLS와 관리자 LinkPay 쓰기 규칙을 고정한다**

- authenticated admin은 payment_links를 조회·생성·수정할 수 있다.
- 연결 Order가 없는 Link만 삭제할 수 있다. 거래가 있는 Link는 disabled_at을 설정한다.
- 활성 Link의 내용 수정은 허용한다. 이미 생성된 Order는 item_snapshot과 amount가 바뀌지 않는다.
- authenticated admin은 orders, payments, refunds를 읽을 수 있지만 직접 insert/update/delete하지 않는다.
- anon은 네 테이블과 RPC에 직접 접근하지 않는다.
- service_role만 public checkout route, callback, webhook, refund route에서 원장을 쓴다.

- [ ] **Step 6: DB와 타입 계약을 검증한다**

Run:

~~~bash
pnpm dlx supabase@2.113.0 db reset
pnpm dlx supabase@2.113.0 test db supabase/tests/reusable_unified_payment_ledger.sql
pnpm --filter @repo/supabase test
pnpm --filter @repo/supabase check-types
~~~

Expected:

- 같은 Link token과 서로 다른 request ID로 서로 다른 Order 두 건 생성.
- 두 결제 성공 후에도 payment_links row 변경 없음.
- 같은 request ID 재호출은 Order/Payment 중복 없음.
- 부분환불 두 건의 성공 누계와 balance_amount 일치.
- 잔액 초과와 unknown 중 추가 환불 차단.

- [ ] **Step 7: 원장 변경을 커밋한다**

~~~bash
git add supabase/migrations supabase/tests packages/supabase/src/types.ts packages/supabase/tests/payment-links-contract.test.mjs
git commit -m "feat: add reusable unified payment ledger"
~~~

---

### Task 2: 공통 Supabase API와 NICEPAY 승인 경로

**Files:**

- Modify: packages/supabase/src/paymentLinks.ts
- Create: packages/supabase/src/payments.ts
- Create: packages/supabase/src/refunds.ts
- Modify: packages/supabase/src/index.ts
- Modify: apps/user/lib/nicepay.ts
- Create: apps/user/lib/paymentCheckout.ts
- Modify: apps/user/app/api/payments/nicepay/return/route.ts
- Modify: apps/user/app/api/payments/nicepay/webhook/route.ts
- Create: apps/user/app/(site)/payment/result/[publicToken]/page.tsx
- Modify: apps/user/app/(site)/order/OrderPaymentResult.tsx
- Modify: apps/user/__tests__/nicepay.test.mjs
- Modify: apps/user/__tests__/linkpay-payment.test.mjs
- Create: apps/user/__tests__/payment-result.test.mjs

**Interfaces:**

- Produces createSiteCheckout(client, input) -> CheckoutSession.
- Produces createLinkPayCheckout(client, input) -> CheckoutSession.
- Produces finishPayment(client, input) -> PaymentRow.
- Produces getPaymentByProviderOrderId(client, providerOrderId) -> PaymentWithOrder.
- Produces getOrderResultByPublicToken(client, publicToken) -> SafeOrderResult.
- Produces NicepayCheckoutRequest = { amount, clientId, goodsName, method: "card", orderId, returnUrl }.

- [ ] **Step 1: 공통 결제 helper 계약 테스트를 실패시킨다**

테스트에서 다음을 검사한다.

~~~js
assert.match(paymentHelpers, /createSiteCheckout/);
assert.match(paymentHelpers, /createLinkPayCheckout/);
assert.match(paymentHelpers, /finishPayment/);
assert.match(returnRoute, /getPaymentByProviderOrderId/);
assert.doesNotMatch(returnRoute, /searchParams\\.get\\("token"\\)/);
assert.match(resultPage, /getOrderResultByPublicToken/);
~~~

Run: pnpm --filter user test

Expected: 새 helper와 공통 결과 페이지가 없어 FAIL.

- [ ] **Step 2: Supabase wrapper와 안전한 결과 DTO를 구현한다**

paymentLinks.ts는 템플릿 CRUD와 public token 조회만 담당한다. payments.ts는 checkout/finish RPC와 provider_order_id 조회를 담당하고 refunds.ts는 Task 6에서 사용할 환불 RPC wrapper를 export한다.

공개 결과 DTO는 다음 필드만 반환한다.

~~~ts
export type SafeOrderResult = {
  channel: "site" | "linkpay";
  orderName: string;
  paymentMethod: string | null;
  status:
    | "open"
    | "payment_pending"
    | "paid"
    | "partially_refunded"
    | "refunded";
  totalAmount: number;
};
~~~

buyer_name, buyer_phone, buyer_email, 다른 고객의 Order 목록은 공개 DTO에 포함하지 않는다.

- [ ] **Step 3: NICEPAY 응답 parser를 원장 필드까지 확장한다**

NicepayPayment에 다음 필드를 추가하고 parser 테스트를 작성한다.

~~~ts
export type NicepayPayment = {
  amount: number;
  balanceAmt: number;
  cancelledAt: string | null;
  cancelledTid: string | null;
  cancels: ReadonlyArray<{
    amount: number;
    cancelledAt: string;
    reason: string;
    receiptUrl: string | null;
    tid: string;
  }>;
  card: { canPartCancel: boolean } | null;
  orderId: string;
  paidAt: string | null;
  payMethod: string | null;
  receiptUrl: string | null;
  resultCode: string;
  resultMsg: string;
  signature: string;
  status: NicepayPaymentStatus;
  tid: string;
};
~~~

기존 timingSafeEqual 서명 검증, 30초 AbortSignal timeout, approve/retrieve/net-cancel helper는 유지한다.

- [ ] **Step 4: callback을 Link token에서 분리한다**

공통 return URL은 /api/payments/nicepay/return 하나만 사용한다.

~~~text
signed callback orderId
  → DB에서 Payment + Order 조회
  → amount/clientId/orderId/signature 검증
  → NICEPAY 승인
  → 승인 응답 amount/TID/orderId/signature 검증
  → finishPayment
  → /payment/result/{orders.public_token} 303 redirect
~~~

승인 응답이 불명확하면 거래 조회를 한 번 수행한다. 그래도 불명확하면 먼저 `finish_payment(unknown, result_code=NET_CANCEL_REQUESTED)`로 내구성 있는 망취소 표식을 저장하고, 이 저장에 성공한 호출만 `netCancelNicepayPayment`를 호출한다. 망취소 성공은 결제 후 환불이 아니라 승인 실패 복구이므로 `payments.failed`와 `result_code=NET_CANCELLED`로 기록해 같은 Order의 재결제를 허용한다. 성공 응답 뒤 원장 쓰기가 실패하면 서명 검증된 TID와 `NET_CANCEL_PERSISTENCE_UNKNOWN`을 한 번 더 기록하고, 웹훅은 이 두 표식이 있는 결제만 원 주문 ID로 복구한다. 표식 없는 외부 취소는 `unknown` 수동 검토로 남긴다. `payments.cancelled`는 로컬에서 paid였던 거래의 환불 잔액이 0원이 된 경우에만 사용한다. 브라우저 query string의 status나 result는 읽지 않는다.

- [ ] **Step 5: webhook을 같은 finishPayment 경로에 연결한다**

- provider payload를 parse하고 서명을 검증한다.
- provider orderId로 Payment를 찾고 DB amount 및 기존 TID와 비교한다.
- 로컬 TID가 없으면 NICEPAY 거래 조회 결과까지 검증한다.
- paid, failed, expired는 finishPayment로 기록하고, partialCancelled와 cancelled는 Task 7의 취소·환불 동기화 helper로 기록한다.
- NICEPAY webhook test의 존재하지 않는 orderId는 정확한 text/html OK로 응답한다.
- 알려진 거래의 amount/TID mismatch는 400이다.

- [ ] **Step 6: 단일 결과 페이지를 DB 상태로 렌더링한다**

OrderPaymentResult에 pending variant를 추가한다.

~~~ts
type OrderPaymentResultProps =
  | { variant: "success"; data: OrderPaymentSuccessData }
  | { variant: "failure"; data: OrderPaymentFailureData }
  | { variant: "pending" };
~~~

/payment/result/[publicToken]은 DB 상태만 사용한다.

~~~text
open                 → failure
payment_pending      → pending
paid                 → success
partially_refunded   → success + 부분환불 표시
refunded             → success + 환불완료 표시
~~~

페이지 metadata는 noindex로 설정한다.

- [ ] **Step 7: 공통 승인 경로를 검증하고 커밋한다**

~~~bash
pnpm --filter @repo/supabase test
pnpm --filter user test
pnpm --filter user check-types
git add packages/supabase/src apps/user/lib apps/user/app/api/payments apps/user/app/\(site\)/payment apps/user/app/\(site\)/order/OrderPaymentResult.tsx apps/user/__tests__
git commit -m "feat: unify NICEPAY payment completion"
~~~

---

### Task 3: LinkPay를 공개 재사용 템플릿으로 전환

**Files:**

- Modify: apps/admin/src/pages/linkPayData.ts
- Modify: apps/admin/src/pages/LinkPayPage.tsx
- Modify: apps/admin/src/pages/LinkPayFormPage.tsx
- Modify: apps/admin/tests/linkPayData.test.mjs
- Modify: apps/admin/tests/linkPayPage.test.mjs
- Modify: apps/admin/tests/linkPayFormPage.test.mjs
- Modify: apps/user/app/(site)/linkpay/[id]/page.tsx
- Modify: apps/user/app/(site)/linkpay/[id]/LinkPayPaymentForm.tsx
- Delete: apps/user/app/_content/linkPay.ts
- Delete: apps/user/app/(site)/linkpay/[id]/payment.ts
- Delete: apps/user/app/(site)/linkpay/[id]/success/page.tsx
- Delete: apps/user/app/(site)/linkpay/[id]/fail/page.tsx
- Modify: apps/user/app/api/linkpay/[publicToken]/order/route.ts
- Modify: apps/user/__tests__/linkpay-page.test.mjs
- Modify: apps/user/__tests__/linkpay-payment.test.mjs

**Interfaces:**

- LinkPayEffectiveState = "active" | "disabled".
- POST /api/linkpay/:publicToken/order consumes { checkoutRequestId, customer, agreements }.
- Success returns NicepayCheckoutRequest from Task 2.
- Same token plus different checkoutRequestId returns different provider order IDs.

- [ ] **Step 1: 재사용 계약 테스트를 먼저 실패시킨다**

~~~js
assert.doesNotMatch(pageSource, /status !== "pending".*redirect/s);
assert.doesNotMatch(routeSource, /link\\.status === "paid"/);
assert.match(routeSource, /createLinkPayCheckout/);
assert.match(routeSource, /checkoutRequestId/);
assert.match(formSource, /crypto\\.randomUUID/);
~~~

DB integration test에는 다음 세 assertion을 추가한다.

~~~js
assert.notEqual(firstCheckout.order_id, secondCheckout.order_id);
assert.equal(replayedCheckout.order_id, firstCheckout.order_id);
assert.equal(linkAfterBothPayments.disabled_at, null);
~~~

- [ ] **Step 2: 관리자 LinkPay 상태와 동작을 변경한다**

- 결제전/결제완료 필터를 활성/중단으로 교체한다.
- 결제 완료 여부를 payment_links에 표시하지 않는다.
- 링크 URL 복사 기능은 public_token을 그대로 사용한다.
- 거래가 있어도 템플릿 수정은 허용하고 기존 Order snapshot은 유지한다.
- 거래가 없는 Link만 삭제하고, 거래가 있으면 중단 버튼으로 disabled_at을 설정한다.

- [ ] **Step 3: 공개 LinkPay 페이지를 항상 열리게 한다**

page.tsx는 fixture 대신 getPublicPaymentLink를 사용한다.

~~~text
active   → 결제 상세 + Form
disabled → 결제 상세 + "현재 결제가 중단된 링크입니다"
missing  → 404
~~~

과거 Order나 결제 건수, 결제 성공 여부, 구매자 정보는 표시하지 않는다.

- [ ] **Step 4: Form 제출을 새 Order 생성 API에 연결한다**

유효한 제출을 시작할 때 crypto.randomUUID()를 한 번 만들고 네트워크 재시도에는 같은 값을 사용한다. route는 customer와 agreements를 서버에서 다시 검증하고 body의 amount, orderId, status, returnUrl은 읽지 않는다.

응답 상태:

~~~text
invalid body              → 400
missing token             → 404
disabled link             → 409
configuration failure     → 500
checkout created          → 200
~~~

200 응답을 AUTHNICE.requestPay에 전달한다.

- [ ] **Step 5: LinkPay 테스트와 빌드를 통과시키고 커밋한다**

~~~bash
pnpm --filter admin test
pnpm --filter admin build
pnpm --filter user test
pnpm --filter user build
git add apps/admin/src/pages apps/admin/tests apps/user/app/\(site\)/linkpay apps/user/app/api/linkpay apps/user/__tests__
git commit -m "feat: make LinkPay reusable"
~~~

---

### Task 4: 사이트 일반 결제를 공통 checkout에 연결

**Files:**

- Create: apps/user/app/api/orders/checkout/route.ts
- Modify: apps/user/app/(site)/order/payment.ts
- Modify: apps/user/app/(site)/order/page.tsx
- Delete: apps/user/app/(site)/order/success/page.tsx
- Delete: apps/user/app/(site)/order/fail/page.tsx
- Modify: apps/user/__tests__/order-page.test.mjs
- Create: apps/user/__tests__/site-payment.test.mjs

**Interfaces:**

- POST /api/orders/checkout consumes { checkoutRequestId, customer, agreements, selection }.
- selection contains only catalog IDs and hasPlanning.
- Success returns NicepayCheckoutRequest from Task 2.

- [ ] **Step 1: 서버 가격 재계산 계약 테스트를 실패시킨다**

~~~js
assert.match(routeSource, /getOrderOptionConfig/);
assert.match(routeSource, /getOrderQuantityOptions/);
assert.match(routeSource, /createSiteCheckout/);
assert.doesNotMatch(routeSource, /body\\.amount/);
assert.doesNotMatch(routeSource, /body\\.totalPrice/);
~~~

- [ ] **Step 2: 사이트 checkout route를 구현한다**

- serviceId, pageId, paperId, quantityId, hasPlanning을 현재 catalog에서 조회한다.
- unit price와 planning fee를 서버에서 합산한다.
- label과 가격을 SiteOrderSnapshot으로 만든다.
- customer와 agreements를 LinkPay route와 같은 규칙으로 검증한다.
- createSiteCheckout을 호출해 Order + Payment를 만든다.
- returnUrl은 공통 callback만 사용한다.

- [ ] **Step 3: 주문 Form을 NICEPAY 호출에 연결한다**

payment.ts의 fixture 반환을 실제 fetch로 교체하고 LinkPay와 같은 checkout response 타입을 사용한다. 두 component의 AUTHNICE.requestPay 호출이 10줄을 넘지 않으면 별도 React hook을 만들지 않는다.

- [ ] **Step 4: 일반 결제 결과를 공통 결과 페이지로 연결한다**

callback이 Order public token으로 /payment/result/[publicToken]에 보내므로 기존 /order/success와 /order/fail은 삭제한다. 결과 page는 channel에 따라 일반 주문 CTA 또는 LinkPay CTA를 선택한다.

- [ ] **Step 5: 일반 결제 테스트와 빌드를 통과시키고 커밋한다**

~~~bash
pnpm --filter user test
pnpm --filter user build
git add apps/user/app/api/orders apps/user/app/\(site\)/order apps/user/__tests__
git commit -m "feat: connect site checkout to NICEPAY"
~~~

---

### Task 5: 검증 원장에서 통합 매출 계산

**Files:**

- Create: packages/supabase/src/sales.ts
- Create: packages/supabase/tests/sales.test.mjs
- Modify: packages/supabase/src/index.ts
- Modify: apps/admin/src/pages/salesData.ts
- Modify: apps/admin/src/pages/SalesPage.tsx
- Modify: apps/admin/src/components/admin-sales/SalesSummaryCards.tsx
- Modify: apps/admin/src/components/admin-sales/SalesTrendChart.tsx
- Modify: apps/admin/src/components/admin-sales/SalesTransactionsTable.tsx
- Modify: apps/admin/tests/salesData.test.mjs

**Interfaces:**

- getAdminSalesDashboard(client, { channel, from, to }) -> SalesDashboardData.
- channel = "all" | "site" | "linkpay".
- SalesSummary = { grossSalesAmount, paymentCount, refundedAmount, netSalesAmount }.
- SalesEvent.kind = "payment" | "refund".

- [ ] **Step 1: 매출 계산 테스트를 먼저 실패시킨다**

~~~js
assert.deepEqual(
  summarizeSalesEvents([
    { amount: 10000, channel: "site", kind: "payment", status: "paid" },
    { amount: 7000, channel: "linkpay", kind: "payment", status: "paid" },
    { amount: 4000, channel: "site", kind: "refund", status: "succeeded" },
    { amount: 9000, channel: "site", kind: "payment", status: "unknown" },
  ]),
  {
    grossSalesAmount: 17000,
    paymentCount: 2,
    refundedAmount: 4000,
    netSalesAmount: 13000,
  },
);
~~~

Run: pnpm --filter admin test

Expected: 실제 event helper가 없어 FAIL.

- [ ] **Step 2: 두 조회로 read model을 만든다**

- payments에서 paid_at 기간의 paid, partial_cancelled, cancelled를 orders와 join한다.
- refunds에서 refunded_at 기간의 succeeded를 payments와 orders에 join한다.
- unknown Payment와 Refund는 거래 표에만 포함하고 summary에서는 제외한다.
- channel filter는 두 조회에 같은 orders.channel 조건을 적용한다.
- 기간은 KST 시작 inclusive, 종료 다음 날 exclusive, 최대 366일이다.
- 별도 sales table, view, cache를 만들지 않는다.

- [ ] **Step 3: fixture UI를 실제 데이터로 교체한다**

요약 카드는 기간 순매출, 총 승인액, 결제 건수, 환불액만 표시한다. 거래 표는 다음 열만 유지한다.

~~~text
채널 | 구분 | 상태 | 주문명 | 고객 | 거래일자 | 거래금액 | 환불가능액 | 영수증 | 환불
~~~

cardFee, settlementAmount, scheduled, settled, monthlyVisitorCount, preview query, applyLocalRefund를 제거한다.

- [ ] **Step 4: 매출 테스트와 빌드를 통과시키고 커밋한다**

~~~bash
pnpm --filter @repo/supabase test
pnpm --filter admin test
pnpm --filter admin build
git add packages/supabase/src/sales.ts packages/supabase/tests/sales.test.mjs packages/supabase/src/index.ts apps/admin/src/pages apps/admin/src/components/admin-sales apps/admin/tests/salesData.test.mjs
git commit -m "feat: show verified payment sales"
~~~

---

### Task 6: 결제별 부분·전액환불

**Files:**

- Modify: apps/user/lib/nicepay.ts
- Create: apps/user/lib/adminPaymentAuth.ts
- Create: apps/user/app/api/admin/payments/[paymentId]/refund/route.ts
- Create: apps/admin/src/lib/paymentApi.ts
- Modify: apps/admin/src/pages/SalesPage.tsx
- Modify: apps/admin/src/components/admin-sales/RefundDialog.tsx
- Modify: apps/admin/tests/salesData.test.mjs
- Modify: apps/user/__tests__/nicepay.test.mjs
- Create: apps/user/__tests__/payment-refund.test.mjs

**Interfaces:**

- POST /api/admin/payments/:paymentId/refund consumes { requestId, amount, reason }.
- Success: 200 { status: "succeeded", refundedAmount, refundableAmount }.
- Pending verification: 202 { status: "unknown" }.
- Invalid request: 400 { error }.
- Reservation conflict: 409 { error }.
- Provider rejection: 409 { status: "failed", error }.

- [ ] **Step 1: NICEPAY 취소 계약 테스트를 먼저 실패시킨다**

테스트는 다음을 고정한다.

~~~js
assert.equal(fullCancelBody.cancelAmt, undefined);
assert.equal(partialCancelBody.cancelAmt, 4000);
assert.equal(partialCancelBody.orderId, refundOrderId);
assert.equal(parsed.balanceAmt, 6000);
assert.equal(parsed.cancelledTid, "cancel-tid");
assert.equal(parsed.card.canPartCancel, true);
~~~

Run: pnpm --filter user test

Expected: cancelNicepayPayment가 없어 FAIL.

- [ ] **Step 2: 취소 helper를 공식 REST 계약대로 구현한다**

~~~ts
export async function cancelNicepayPayment(
  config: NicepayConfig,
  tid: string,
  input: {
    amount: number;
    currentBalance: number;
    orderId: string;
    reason: string;
  },
): Promise<NicepayPayment>;
~~~

POST /v1/payments/{tid}/cancel을 사용한다.

- amount가 currentBalance보다 작으면 cancelAmt를 넣는다.
- amount가 currentBalance와 같으면 cancelAmt를 생략해 남은 잔액을 전액취소한다.
- 부분취소 orderId는 Refund마다 고유해야 한다.
- 응답의 원 TID, 서명, amount, balanceAmt, cancelledTid, cancels를 검증한다.
- card.canPartCancel이 false인 Payment의 부분환불은 provider 호출 전에 거절한다.

공식 계약 근거:

- https://github.com/nicepayments/nicepay-manual/blob/main/api/cancel.md
- https://start.nicepay.co.kr/manual/quickguide/overview.do

- [ ] **Step 3: 관리자 인증을 한 파일로 구현한다**

adminPaymentAuth.ts는 다음 순서로만 인증한다.

~~~text
Origin === ADMIN_APP_URL
  → Authorization: Bearer token 한 개
  → publishable Supabase client의 auth.getUser(token)
  → user.app_metadata.role === "admin"
~~~

인증이 끝난 뒤에만 service-role client를 만든다. CORS OPTIONS는 허용 origin에만 POST, OPTIONS와 Authorization, Content-Type을 반환한다.

- [ ] **Step 4: 예약 → provider 취소 → 원장 확정 route를 구현한다**

~~~text
입력 검증
  → reserveRefund(requestId)
  → 기존 succeeded/unknown이면 provider 재호출 없이 반환
  → cancelNicepayPayment(original TID)
  → signed response와 balanceAmt 검증
  → finishRefund
~~~

검증된 provider 거절은 failed로 기록한다. timeout 후 거래 조회에서도 취소 내역을 확인할 수 없으면 unknown으로 기록하고 202를 반환한다. unknown 예약액은 추가 환불을 계속 차단한다.

- [ ] **Step 5: RefundDialog를 실제 API에 연결한다**

- dialog를 열 때 crypto.randomUUID()를 한 번 만들고 같은 제출 재시도에 재사용한다.
- 최대값은 refundableAmount다.
- 사유는 trim 후 1~100자다.
- 성공하면 매출 데이터를 다시 불러온다.
- 202이면 완료 문구 대신 "환불 결과 확인 중"을 표시한다.

- [ ] **Step 6: 부분→잔액 전액환불을 검증한다**

자동 테스트:

- 인증 없음 401, non-admin 403, 잘못된 Origin 403.
- 같은 requestId 두 번은 NICEPAY 호출 한 번.
- 10,000원 Payment에서 4,000원 환불 후 balance 6,000원.
- 나머지 6,000원 환불 후 balance 0원과 cancelled/refunded.
- 부분취소 불가 카드의 4,000원 요청은 provider 호출 전 409.
- timeout은 unknown/202이고 같은 Payment 추가 환불 차단.
- LinkPay와 site Payment가 같은 endpoint 사용.

Run:

~~~bash
pnpm --filter user test
pnpm --filter admin test
pnpm --filter user build
pnpm --filter admin build
~~~

- [ ] **Step 7: 환불 변경을 커밋한다**

~~~bash
git add apps/user/lib apps/user/app/api/admin apps/user/__tests__ apps/admin/src/lib apps/admin/src/pages/SalesPage.tsx apps/admin/src/components/admin-sales/RefundDialog.tsx apps/admin/tests/salesData.test.mjs
git commit -m "feat: support partial and full refunds"
~~~

---

### Task 7: 결과 불명 복구와 최종 검증

**Files:**

- Create: apps/user/app/api/admin/payments/[paymentId]/reconcile/route.ts
- Modify: apps/user/app/api/payments/nicepay/webhook/route.ts
- Modify: apps/user/__tests__/payment-refund.test.mjs
- Create: docs/payments-runbook.md

**Interfaces:**

- POST /api/admin/payments/:paymentId/reconcile returns 200 resolved or 202 still unknown.
- 자동 reconcile은 기존 Refund 예약과 일치하는 NICEPAY 취소만 확정한다. 예약 없는 외부 취소는 자동 원장화하지 않는다.

- [ ] **Step 1: reconciliation 테스트를 먼저 실패시킨다**

다음 경우를 고정한다.

- unknown Payment 조회 결과가 paid면 결제 원장 확정.
- unknown Refund의 예약 금액과 provider 잔액 감소가 일치하면 cancelledTid를 기록하고 원장 확정.
- 로컬 예약 없이 partialCancelled 또는 cancelled가 발견되면 Payment를 unknown으로 유지하고 관리자 확인을 요구.
- provider balance가 증가하거나 성공 환불 누계와 불일치하면 unknown 유지.
- 같은 callback, webhook, reconcile 재호출은 Refund 중복 없음.

- [ ] **Step 2: 관리자 상태 확인 endpoint를 구현한다**

Task 6의 adminPaymentAuth를 재사용한다. DB의 원 TID로 NICEPAY 거래를 조회하고 서명, orderId, amount, TID를 검증한 뒤 기존 finishPayment와 finishRefund만 호출한다. 새 상태 머신이나 worker를 만들지 않는다.

- [ ] **Step 3: webhook 취소 상태를 기존 Refund 예약에만 연결한다**

provider cancel이 기존 requested 또는 unknown Refund의 금액·예상 잔액과 일치할 때만 cancelledTid로 idempotent 확정한다. 일치하는 예약이 없으면 임의의 Refund를 만들지 않고 Payment를 unknown으로 유지한다. MVP 운영에서는 모든 환불을 관리자 화면에서 시작하고 NICEPAY 콘솔 직접 취소는 금지한다.

- [ ] **Step 4: 자동 검증을 모두 통과시킨다**

~~~bash
pnpm dlx supabase@2.113.0 db reset
pnpm dlx supabase@2.113.0 test db supabase/tests/reusable_unified_payment_ledger.sql
pnpm test
pnpm check-types
pnpm lint
pnpm build
rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages
~~~

Expected: 모든 명령 성공, 마지막 rg는 출력 없음.

- [ ] **Step 5: NICEPAY sandbox 수동 시나리오를 통과시킨다**

1. LinkPay 하나를 만들고 동일 URL을 브라우저 두 개에서 연다.
2. 서로 다른 고객정보로 두 결제를 완료하고 서로 다른 Order, provider order ID, TID를 확인한다.
3. 첫 Payment를 부분환불하고 LinkPay URL에서 세 번째 결제가 계속 가능한지 확인한다.
4. 첫 Payment의 남은 잔액을 전액환불하고 두 번째 Payment가 그대로 paid인지 확인한다.
5. 사이트 일반 주문 한 건을 결제하고 같은 매출 화면에 channel=site로 나타나는지 확인한다.
6. 총 승인액, 환불액, 순매출을 DB와 NICEPAY TID/cancelledTid로 대조한다.
7. LinkPay를 disabled 처리하고 기존 URL은 안내 화면이 열리지만 새 checkout은 409인지 확인한다.

- [ ] **Step 6: 운영 runbook을 작성한다**

docs/payments-runbook.md에 다음 명령과 대응만 기록한다.

- sandbox/production key와 domain 전환
- 공통 return URL과 webhook URL
- webhook의 정확한 OK 응답
- unknown Payment/Refund 상태 확인 절차
- LinkPay 중단 확인
- provider TID/cancelledTid와 DB 대조
- 부분취소 계약 및 canPartCancel=false 대응
- NICEPAY 콘솔 직접 취소 금지와 예상하지 못한 취소의 수동 확인

- [ ] **Step 7: 최종 변경을 커밋한다**

~~~bash
git add apps/user/app/api/admin apps/user/app/api/payments apps/user/__tests__ docs/payments-runbook.md
git commit -m "test: verify reusable payment lifecycle"
~~~

---

## Completion Criteria

- 같은 LinkPay URL에서 서로 다른 고객의 결제가 연속 성공한다.
- LinkPay는 결제·실패·unknown·부분환불·전액환불로 상태가 바뀌지 않는다.
- LinkPay 중단은 새 checkout만 막고 공개 안내 페이지는 유지한다.
- 사이트와 LinkPay가 같은 payments/refunds 원장과 callback/webhook을 사용한다.
- 결제 결과 페이지는 DB 상태만 표시하고 다른 구매자 정보를 노출하지 않는다.
- 부분환불 여러 건과 잔액 전액환불이 provider balance와 일치한다.
- unknown은 해당 Order 또는 Payment만 잠그고 다른 LinkPay 고객을 막지 않는다.
- 매출은 승인액과 성공 환불액으로 계산되며 sales table/view가 없다.
- 자동 테스트, 타입 검사, lint, build, DB test와 sandbox 수동 시나리오가 모두 통과한다.
