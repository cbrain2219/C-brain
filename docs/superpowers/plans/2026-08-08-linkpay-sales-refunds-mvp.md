# LinkPay Payment, Sales, and Refund MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자가 고정금액 LinkPay를 발급하고, 고객이 NICEPAY 카드 결제를 안전하게 완료하며, 승인·환불 원장을 기준으로 관리자 매출 화면과 전액·부분환불을 실제 데이터에 연결한다.

**Architecture:** `payment_links`, `payment_orders`, `payment_refunds` 세 테이블만 영속 원장으로 사용하고 별도 `sales` 테이블은 만들지 않는다. 결제와 환불은 Next.js 서버가 NICEPAY 비밀키를 소유하며, 관리자 매출 화면은 검증된 승인과 성공 환불을 조회해 총 승인액·환불액·순매출을 계산한다. 결과가 불명확한 결제나 환불은 `unknown`으로 잠그고 조회·웹훅으로 확정되기 전까지 같은 링크의 재결제나 추가 환불을 막는다.

**Tech Stack:** React 19, Next.js 16 App Router, Vite admin, TypeScript, Supabase/PostgreSQL, Supabase CLI, NICEPAY JS SDK 및 Server 승인/취소 API

## Global Constraints

- 이 계획은 기존 결제 데이터가 개발용이며 삭제 가능한 상태라는 사용자 설명을 전제로 한다. 실거래가 한 건이라도 있으면 기존 migration 삭제와 DB reset을 실행하지 않고 forward migration 계획으로 전환한다.
- 1차 결제수단은 KRW 고정금액 카드 결제만 지원한다. 가상계좌, 계좌이체, 간편결제, 정기결제는 제외한다.
- 한 LinkPay는 최종 승인 후 다시 사용할 수 없다. 전액환불 뒤에도 새 결제에는 새 링크를 발급한다.
- NICEPAY 주문번호, TID, 취소 주문번호, 취소 TID는 각각 고유해야 한다.
- 브라우저가 보낸 금액·상태·TID는 신뢰하지 않는다. 서버가 DB 금액을 조회하고 NICEPAY 서명, 주문번호, TID, 금액을 검증한다.
- 승인 또는 환불 결과가 타임아웃으로 불명확하면 실패로 처리하지 않는다. `unknown`으로 저장하고 거래 조회·웹훅으로 확정할 때까지 재시도를 차단한다.
- `payment_orders`와 `payment_refunds`는 브라우저 쓰기를 허용하지 않는다. 관리자 읽기만 RLS로 허용하고 모든 상태 변경은 server secret client를 사용한다.
- `NICEPAY_SECRET_KEY`와 Supabase secret/service-role key는 브라우저 번들, DB, 로그에 남기지 않는다.
- 카드번호, 인증 토큰, 원본 NICEPAY payload는 저장하지 않는다. 구매자 이름·회사·전화·이메일과 개인정보 동의시각만 주문 스냅샷으로 저장한다.
- “매출”은 앱 내부의 PG 거래 지표다. 기간 총 승인액, 기간 성공 환불액, 기간 순매출을 제공하며 회계상 매출 인식이나 세무 장부를 대신하지 않는다.
- 카드 수수료, 정산완료 여부, 정산예정액은 NICEPAY 정산대사 데이터를 연동하기 전에는 계산하거나 화면에 표시하지 않는다.
- 기간 지표는 `Asia/Seoul` 기준으로 시작일 00:00 이상, 종료일 다음 날 00:00 미만을 사용한다.
- 환불은 원 결제의 남은 취소 가능 금액 내에서 전액 또는 부분환불을 지원한다. 모든 부분환불 요청은 새로운 고유 `refund_order_id`를 사용한다.
- UI 수정 전 `design.md`를 읽고 Pretendard GOV 토큰, 공용 아이콘, 부모 `gap`, 기존 dialog 동작을 유지한다.
- Figma MCP asset URL을 소스에 추가하지 않는다. 이 계획에는 신규 이미지 asset이 필요하지 않다.

## Product Definitions

| 용어           | 정의                                                                         |
| -------------- | ---------------------------------------------------------------------------- |
| 총 승인액      | 선택 기간에 `paid_at`이 포함된 검증된 결제 승인 금액의 합계                  |
| 환불액         | 선택 기간에 `refunded_at`이 포함된 `succeeded` 환불 금액의 합계              |
| 순매출         | `총 승인액 - 환불액`; 기간 밖 결제의 기간 내 환불도 해당 기간 환불액에 포함  |
| 취소 가능 금액 | NICEPAY의 검증된 `balanceAmt`; 승인 직후 결제금액이며 성공 환불마다 감소     |
| 결과 불명      | 외부 API 호출 여부나 성공 여부를 확정할 수 없어 결제/환불 재시도를 잠근 상태 |

## File Map

| File                                                            | Responsibility                                             |
| --------------------------------------------------------------- | ---------------------------------------------------------- |
| `supabase/migrations/*_create_linkpay_sales_refund_ledger.sql`  | 링크·주문·환불 테이블, 제약, RLS, 원자적 RPC               |
| `supabase/tests/payment_sales_refunds.sql`                      | 실제 PostgreSQL 상태·금액·중복 방지 계약                   |
| `packages/supabase/src/types.ts`                                | 결제·환불·매출 TypeScript 계약                             |
| `packages/supabase/src/paymentLinks.ts`                         | 관리자 LinkPay CRUD와 서버 결제/환불 원장 helper           |
| `packages/supabase/src/sales.ts`                                | 승인·환불 이벤트 조회와 매출 화면 read model 변환          |
| `apps/user/lib/nicepay.ts`                                      | NICEPAY 승인·조회·망취소·일반취소 parsing/signature client |
| `apps/user/app/(site)/linkpay/[id]/*`                           | DB 기반 결제·성공·실패·결과 불명 화면                      |
| `apps/user/app/api/linkpay/[publicToken]/order/route.ts`        | 구매자 검증과 주문 생성, 결제창 요청값 반환                |
| `apps/user/app/api/payments/nicepay/return/route.ts`            | 인증 callback 검증, 승인, 불명 상태 기록                   |
| `apps/user/app/api/payments/nicepay/webhook/route.ts`           | 결제·취소 웹훅 검증과 단조 상태 동기화                     |
| `apps/user/app/api/admin/payments/[orderId]/refund/route.ts`    | 관리자 인증, 환불 금액 예약, NICEPAY 취소, 결과 확정       |
| `apps/user/app/api/admin/payments/[orderId]/reconcile/route.ts` | `unknown` 결제·환불 수동 재확인                            |
| `apps/admin/src/lib/paymentApi.ts`                              | 관리자 access token을 포함한 refund/reconcile API client   |
| `apps/admin/src/pages/SalesPage.tsx`, `salesData.ts`            | 실제 매출 read model 로딩, 기간 선택, 환불 상태 관리       |
| `apps/admin/src/components/admin-sales/*`                       | 총 승인액·환불액·순매출과 실거래 표/환불 dialog 표시       |

---

### Task 1: 결제·환불 원장과 DB 안전장치

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create via CLI: `supabase/config.toml`
- Delete after confirming development-only data: `supabase/migrations/20260722000000_create_payment_links.sql`
- Delete after confirming development-only data: `supabase/migrations/20260723000000_add_payment_link_details.sql`
- Delete after confirming development-only data: `supabase/migrations/20260723000001_create_payment_orders.sql`
- Delete after confirming development-only data: `supabase/migrations/20260723000002_allow_admin_payment_link_delete.sql`
- Create via CLI: `supabase/migrations/*_create_linkpay_sales_refund_ledger.sql`
- Create: `supabase/tests/payment_sales_refunds.sql`
- Modify: `packages/supabase/src/types.ts`
- Modify: `packages/supabase/src/paymentLinks.ts`
- Modify: `packages/supabase/src/index.ts`
- Modify: `packages/supabase/tests/payment-links-contract.test.mjs`

**Interfaces:**

- Produces `PaymentOrderStatus = "ready" | "unknown" | "paid" | "failed" | "cancelled" | "partialCancelled" | "expired"`.
- Produces `PaymentRefundStatus = "requested" | "unknown" | "succeeded" | "failed"`.
- Produces `create_or_reuse_payment_order(publicToken, buyer snapshot, agreedAt) -> payment_orders`.
- Produces `complete_payment_order(orderId, amount, tid, provider fields) -> payment_orders`.
- Produces `create_or_get_payment_refund(orderId, requestId, amount, reason, actorId) -> payment_refunds`.
- Produces `finalize_payment_refund(refundId, cancelledTid, balanceAmount, provider fields) -> payment_refunds`.

- [ ] **Step 1: Supabase CLI를 고정하고 명령을 확인한다**

  Run:

  ```bash
  pnpm add -Dw supabase@2.112.0
  pnpm exec supabase --help
  pnpm exec supabase migration new --help
  pnpm exec supabase init
  pnpm exec supabase migration new create_linkpay_sales_refund_ledger
  ```

  Expected: `supabase/config.toml`과 비어 있는 timestamp migration이 생성되고 `supabase migration new`의 exit code가 0이다.

- [ ] **Step 2: 새 migration 계약 테스트를 먼저 실패시킨다**

  `packages/supabase/tests/payment-links-contract.test.mjs`가 timestamp를 하드코딩하지 않고 suffix로 새 migration을 찾도록 바꾼다.

  ```js
  const migrationName = (await readdir(migrationsDirectory)).find((name) =>
    name.endsWith("_create_linkpay_sales_refund_ledger.sql"),
  );

  assert.ok(migrationName);
  const migration = await readFile(
    new URL(`../../../supabase/migrations/${migrationName}`, import.meta.url),
    "utf8",
  );

  for (const requiredSql of [
    "create table public.payment_links",
    "create table public.payment_orders",
    "create table public.payment_refunds",
    "create_or_reuse_payment_order",
    "complete_payment_order",
    "create_or_get_payment_refund",
    "finalize_payment_refund",
    "provider_status = 'unknown'",
  ]) {
    assert.match(migration, new RegExp(requiredSql.replaceAll(".", "\\.")));
  }
  ```

  Run: `pnpm --filter @repo/supabase test`

  Expected: 새 migration이 비어 있어 required SQL assertion이 FAIL.

- [ ] **Step 3: 세 테이블과 고유성 제약을 migration에 구현한다**

  테이블 관계는 다음으로 고정한다.

  ```sql
  create type public.payment_link_status as enum ('pending', 'paid');
  create type public.payment_refund_status as enum (
    'requested', 'unknown', 'succeeded', 'failed'
  );

  create table public.payment_links (
    id uuid primary key default gen_random_uuid(),
    public_token uuid not null unique default gen_random_uuid(),
    client_name text not null check (char_length(trim(client_name)) > 0),
    payment_name text not null check (char_length(trim(payment_name)) > 0),
    category text not null check (char_length(trim(category)) > 0),
    service text not null check (char_length(trim(service)) > 0),
    paper text not null check (char_length(trim(paper)) > 0),
    page_quantity text not null check (char_length(trim(page_quantity)) > 0),
    amount bigint not null check (amount between 1 and 999999999999),
    status public.payment_link_status not null default 'pending',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create table public.payment_orders (
    id uuid primary key default gen_random_uuid(),
    payment_link_id uuid not null references public.payment_links(id) on delete restrict,
    order_id text not null unique check (order_id ~ '^[A-Za-z0-9_-]{1,64}$'),
    amount bigint not null check (amount between 1 and 999999999999),
    balance_amount bigint check (balance_amount between 0 and amount),
    buyer_name text not null check (char_length(trim(buyer_name)) between 1 and 30),
    buyer_company text,
    buyer_phone text not null,
    buyer_email text not null,
    privacy_agreed_at timestamptz not null,
    nicepay_tid text unique,
    provider_status text not null default 'ready' check (
      provider_status in (
        'ready', 'unknown', 'paid', 'failed',
        'cancelled', 'partialCancelled', 'expired'
      )
    ),
    result_code text,
    result_message text,
    pay_method text,
    receipt_url text,
    paid_at timestamptz,
    cancelled_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create unique index payment_orders_one_blocking_order_per_link
    on public.payment_orders (payment_link_id)
    where provider_status in (
      'ready', 'unknown', 'paid', 'cancelled', 'partialCancelled'
    );

  create table public.payment_refunds (
    id uuid primary key default gen_random_uuid(),
    payment_order_id uuid not null references public.payment_orders(id) on delete restrict,
    request_id uuid not null unique,
    refund_order_id text not null unique check (
      refund_order_id ~ '^[A-Za-z0-9_-]{1,64}$'
    ),
    amount bigint not null check (amount > 0),
    reason text not null check (char_length(trim(reason)) between 1 and 100),
    status public.payment_refund_status not null default 'requested',
    requested_by uuid not null,
    nicepay_cancelled_tid text unique,
    result_code text,
    result_message text,
    receipt_url text,
    requested_at timestamptz not null default now(),
    refunded_at timestamptz,
    updated_at timestamptz not null default now()
  );

  create index payment_orders_paid_at_idx on public.payment_orders (paid_at);
  create index payment_refunds_order_idx on public.payment_refunds (payment_order_id);
  create index payment_refunds_refunded_at_idx on public.payment_refunds (refunded_at);
  ```

  `updated_at`은 하나의 공용 trigger function을 두 테이블과 링크에 재사용한다. 첫 주문 생성 뒤에는 `payment_links.amount`, `payment_name`, 상세 필드를 바꾸거나 링크를 hard-delete하지 못하게 기존 잠금 trigger를 유지한다.

- [ ] **Step 4: 결제 RPC를 최소 상태 규칙으로 구현한다**

  `create_or_reuse_payment_order`는 링크 행을 `FOR UPDATE`로 잠그고 다음 순서로 처리한다.
  1. 링크가 없거나 `paid`이면 예외.
  2. `ready` 주문이 있으면 동일 주문을 반환.
  3. `unknown` 주문이 있으면 `Payment result is unknown.` 예외.
  4. `failed` 또는 `expired` 주문만 있으면 새 `LP{uuid}` 주문을 생성.
  5. 금액은 항상 잠근 링크의 `amount`를 복사하고 구매자 필드는 trim/길이 검증 후 저장.

  `complete_payment_order`는 주문을 `FOR UPDATE`로 잠그고 DB 금액과 인자의 승인 금액이 같은지 확인한다. 이미 같은 TID로 `paid`이면 같은 주문을 반환하고, 다른 TID나 불법 상태이면 거절한다. 성공 시 주문을 `paid`, `balance_amount = amount`로 바꾸고 같은 transaction에서 링크를 `paid`로 바꾼다.

  두 함수는 `SECURITY INVOKER`로 만들고 기본 `PUBLIC` 실행 권한을 revoke한 뒤 `service_role`에만 execute를 grant한다.

- [ ] **Step 5: 환불 RPC로 중복·초과 환불을 차단한다**

  `create_or_get_payment_refund`는 다음 transaction 규칙을 구현한다.

  ```text
  1. request_id가 이미 있으면 기존 refund 반환
  2. payment_order를 FOR UPDATE로 잠금
  3. paid 또는 partialCancelled 상태만 허용
  4. requested + unknown + succeeded 환불 합계를 계산
  5. 새 금액이 order.amount를 넘으면 거절
  6. RF{request_id without hyphens} 주문번호로 requested row 생성
  ```

  `finalize_payment_refund`는 refund와 원 주문을 같은 순서로 잠근다. NICEPAY 응답의 `balanceAmt`가 `0...order.amount` 범위인지 확인하고, 성공 환불 누계가 원 결제금액을 넘으면 거절한다. 성공 시 refund를 `succeeded`로 바꾸며 `refunded_at`, 취소 TID, 영수증을 저장한다. 원 주문은 잔액이 0이면 `cancelled`, 남아 있으면 `partialCancelled`로 바꾸고 `balance_amount`를 기록한다.

- [ ] **Step 6: RLS와 grants를 명시한다**

  세 테이블에 RLS를 활성화한다. `payment_links`는 기존 `profiles.role = 'admin'` 정책으로 관리자 CRUD를 허용한다. `payment_orders`와 `payment_refunds`는 동일한 관리자 `SELECT` 정책만 만들고, `anon`과 `authenticated`의 insert/update/delete를 revoke한다. 서버 상태 변경과 RPC execute는 `service_role`만 허용한다.

  Supabase의 새 프로젝트는 public table을 Data API에 자동 노출하지 않을 수 있으므로 관리자 읽기에 필요한 `GRANT SELECT TO authenticated`를 migration에 명시한다.

- [ ] **Step 7: 실제 DB 계약 테스트를 작성한다**

  `supabase/tests/payment_sales_refunds.sql`은 transaction 안에서 다음을 검증하고 rollback한다.

  ```sql
  begin;
  select plan(10);

  select has_table('public', 'payment_links');
  select has_table('public', 'payment_orders');
  select has_table('public', 'payment_refunds');
  select has_column('public', 'payment_orders', 'balance_amount');
  select has_column('public', 'payment_orders', 'privacy_agreed_at');
  select has_column('public', 'payment_refunds', 'request_id');
  select has_function('public', 'create_or_reuse_payment_order');
  select has_function('public', 'complete_payment_order');
  select has_function('public', 'create_or_get_payment_refund');
  select has_function('public', 'finalize_payment_refund');

  select * from finish();
  rollback;
  ```

  같은 파일의 두 번째 transaction에서 링크·주문·승인을 생성한 뒤 다음을 `throws_ok`/`is`로 검증한다.
  - 동일 `request_id` 환불 요청은 동일 refund ID를 반환한다.
  - 진행 중 환불을 포함해 원 금액을 초과하면 예외가 발생한다.
  - 성공 환불 뒤 `balance_amount`가 응답값과 같아진다.
  - `balance_amount = 0`이면 주문이 `cancelled`가 된다.
  - `unknown` 주문이 있으면 새 주문 생성이 거절된다.

  Run:

  ```bash
  pnpm exec supabase start
  pnpm exec supabase db reset --local --no-seed
  pnpm exec supabase test db --local
  ```

  Expected: 모든 pgTAP assertion 통과.

- [ ] **Step 8: 패키지 타입과 helper를 새 계약에 맞춘다**

  `types.ts`에 `payment_refunds`와 네 RPC 타입을 추가한다. `paymentLinks.ts`에는 다음 서버 helper를 추가한다.

  ```ts
  export function createOrReusePaymentOrder(
    client: CBrainSupabaseClient,
    input: {
      publicToken: string;
      buyerName: string;
      buyerCompany: string | null;
      buyerPhone: string;
      buyerEmail: string;
      privacyAgreedAt: string;
    },
  ): Promise<TableRow<"payment_orders">>;

  export function createOrGetPaymentRefund(
    client: CBrainSupabaseClient,
    input: {
      paymentOrderId: string;
      requestId: string;
      amount: number;
      reason: string;
      requestedBy: string;
    },
  ): Promise<TableRow<"payment_refunds">>;
  ```

  `packages/supabase/src/index.ts`에서 helper를 export한다.

- [ ] **Step 9: DB와 패키지 gate를 통과시킨다**

  Run:

  ```bash
  pnpm exec supabase db reset --local --no-seed
  pnpm exec supabase test db --local
  pnpm --filter @repo/supabase test
  pnpm --filter @repo/supabase check-types
  pnpm --filter @repo/supabase lint
  ```

  Expected: 모두 exit 0. `supabase db advisors`가 사용 가능한 버전이면 실행해 새 payment 객체의 security/performance warning도 0으로 만든다.

---

### Task 2: 실제 LinkPay 결제 완주

**Files:**

- Modify: `apps/user/app/(site)/linkpay/[id]/page.tsx`
- Modify: `apps/user/app/(site)/linkpay/[id]/LinkPayPaymentForm.tsx`
- Delete: `apps/user/app/(site)/linkpay/[id]/payment.ts`
- Delete: `apps/user/app/_content/linkPay.ts`
- Modify: `apps/user/app/(site)/linkpay/[id]/success/page.tsx`
- Modify: `apps/user/app/(site)/linkpay/[id]/fail/page.tsx`
- Modify: `apps/user/app/api/linkpay/[publicToken]/order/route.ts`
- Modify: `apps/user/app/api/payments/nicepay/return/route.ts`
- Modify: `apps/user/app/api/payments/nicepay/webhook/route.ts`
- Modify: `apps/user/lib/nicepay.ts`
- Modify: `apps/user/__tests__/linkpay-page.test.mjs`
- Modify: `apps/user/__tests__/linkpay-payment.test.mjs`
- Modify: `apps/user/__tests__/nicepay.test.mjs`

**Interfaces:**

- `POST /api/linkpay/:publicToken/order` consumes `{ customer, agreements }` and returns the existing NICEPAY `requestPay` fields.
- The browser calls `AUTHNICE.requestPay()` once with server-returned values.
- `unknown` result redirects back to `/linkpay/:token?state=unknown`; that page shows a non-actionable “결제 결과 확인 중” notice.
- `paid` redirects to `/linkpay/:token/success`; verified failure redirects to `/linkpay/:token/fail`.

- [ ] **Step 1: fixture 의존 테스트를 DB 계약 테스트로 바꾼다**

  `linkpay-page.test.mjs`에서 `getLinkPayPayment`, `linkPayPayments`, fixture 고객명 assertion을 제거하고 다음 계약을 추가한다.

  ```js
  assert.match(routeSource, /createAdminSupabaseClient/);
  assert.match(routeSource, /getPublicPaymentLink/);
  assert.doesNotMatch(routeSource, /_content\/linkPay/);
  assert.match(successRouteSource, /getPublicPaymentLink/);
  assert.match(failureRouteSource, /getPublicPaymentLink/);
  ```

  Run: `pnpm --filter user test`

  Expected: 페이지가 아직 fixture를 import하므로 FAIL.

- [ ] **Step 2: 공개 페이지와 결과 페이지를 DB로 전환한다**

  세 페이지는 server-only `createAdminSupabaseClient()`와 `getPublicPaymentLink()`를 사용한다. route param은 내부 ID가 아니라 `public_token`이다. DB row를 기존 UI prop으로 바꾸는 함수는 `page.tsx` 안의 작은 순수 함수 하나로 둔다.

  ```ts
  function toLinkPayPayment(link: TableRow<"payment_links">): LinkPayPayment {
    return {
      amount: link.amount,
      clientName: link.client_name,
      detailRows: [
        { label: "서비스", value: link.service },
        { label: "용지", value: link.paper },
        { label: "페이지 수 / 수량", value: link.page_quantity },
      ],
      id: link.public_token,
      paymentName: link.payment_name,
      status: link.status,
    };
  }
  ```

  `unknown` 주문이 있으면 결제 form 대신 “결제 결과를 확인하고 있습니다. 새 결제를 시도하지 마세요.”를 렌더링한다. `paid` 링크는 success로 redirect한다.

- [ ] **Step 3: 주문 API에서 고객 입력을 서버 검증한다**

  order route는 JSON body를 읽고 이름 1~30자, 이메일 형식, 한국 휴대전화 숫자 형식, 두 약관 동의를 다시 검증한다. `amount`, `orderId`, `status`, `returnUrl`은 body에서 받지 않는다. 검증된 고객정보와 `new Date().toISOString()` 동의시각만 `createOrReusePaymentOrder`에 전달한다.

  잘못된 body는 400, 없는 링크는 404, 이미 결제됐거나 `unknown`이면 409, 서버 오류는 500을 반환한다.

- [ ] **Step 4: 결제 버튼을 NICEPAY SDK에 연결한다**

  `LinkPayPaymentForm`은 기존 client validation을 통과한 뒤 order endpoint를 호출한다.

  ```ts
  const response = await fetch(`/api/linkpay/${payment.id}/order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agreements, customer: fieldValues }),
  });

  if (!response.ok) throw new Error("결제 요청을 준비하지 못했습니다.");

  const order = (await response.json()) as NicepayCheckoutRequest;
  window.AUTHNICE.requestPay({
    ...order,
    fnError() {
      setIsSubmitting(false);
    },
  });
  ```

  공식 SDK `https://pay.nicepay.co.kr/v1/js/`는 `next/script`로 한 번만 로드한다. TypeScript global은 component 파일에 `Window.AUTHNICE` 최소 계약만 선언하고 SDK wrapper class는 만들지 않는다.

- [ ] **Step 5: 승인 불명 상태를 실제 DB에 기록한다**

  기존 return route의 승인→조회→망취소 흐름은 유지한다. 승인 호출과 거래 조회가 모두 실패하고 망취소도 검증되지 않으면 `payment_orders.provider_status = 'unknown'`을 저장한 뒤 main LinkPay 페이지로 redirect한다. 이 분기에서는 `failed`를 쓰지 않는다.

  webhook은 동일 주문/TID/금액/서명을 검증한 뒤 `unknown`을 `paid`, `failed`, `cancelled` 중 NICEPAY가 증명한 상태로만 전이한다. 이미 `paid`인 주문의 중복 callback/webhook은 같은 TID일 때 성공으로 인정한다.

- [ ] **Step 6: 결제 테스트를 통과시킨다**

  자동 테스트에 다음을 추가한다.
  - order body 금액이 무시되고 DB amount만 응답됨.
  - 고객정보와 약관 누락은 400.
  - 변조된 callback 금액·서명은 승인 API를 호출하지 않음.
  - 동일 paid callback은 상태를 바꾸지 않음.
  - 승인 timeout + lookup 실패 + netcancel 실패는 `unknown` helper를 호출함.
  - `unknown` 링크의 order API는 409.

  Run:

  ```bash
  pnpm --filter user test
  pnpm --filter user check-types
  pnpm --filter user lint
  ```

  Expected: 모두 exit 0.

- [ ] **Step 7: NICEPAY 샌드박스 첫 체크포인트를 수행한다**

  관리자에서 1,004원 링크를 만들고 다음을 수동 검증한다.
  1. 공개 링크에 DB 내용이 표시된다.
  2. 결제창에 1,004원이 표시된다.
  3. 승인 뒤 `payment_orders.paid`, `balance_amount = 1004`, `payment_links.paid`가 같은 결과로 저장된다.
  4. 성공 URL이 표시되고 같은 링크에서 결제 버튼이 다시 나오지 않는다.
  5. NICEPAY 매출전표 URL이 DB에 저장된다.

  이 체크포인트가 통과하기 전에는 매출·환불 task로 넘어가지 않는다.

---

### Task 3: 승인·환불 원장 기반 매출 화면

**Files:**

- Create: `packages/supabase/src/sales.ts`
- Modify: `packages/supabase/src/index.ts`
- Modify: `packages/supabase/src/types.ts`
- Create: `packages/supabase/tests/sales.test.mjs`
- Modify: `apps/admin/src/pages/salesData.ts`
- Modify: `apps/admin/src/pages/SalesPage.tsx`
- Modify: `apps/admin/src/components/admin-sales/SalesSummaryCards.tsx`
- Modify: `apps/admin/src/components/admin-sales/SalesTrendChart.tsx`
- Modify: `apps/admin/src/components/admin-sales/SalesTransactionsTable.tsx`
- Modify: `apps/admin/tests/salesData.test.mjs`

**Interfaces:**

- Produces `getAdminSalesDashboard(client, { from, to }): Promise<SalesDashboardData>`.
- `SalesSummary = { grossSalesAmount, paymentCount, refundedAmount, netSalesAmount }`.
- Chart series are positive `payments` and `refunds` daily amounts.
- Transaction rows are event rows with `kind: "payment" | "refund"`; only payment rows with `refundableAmount > 0` expose the refund action.

- [ ] **Step 1: 실제 매출 타입으로 테스트를 먼저 바꾼다**

  `salesData.test.mjs`에서 fixture와 `applyLocalRefund` assertion을 제거하고 다음 순수 계산 계약을 작성한다.

  ```js
  const summary = summarizeSalesEvents([
    { amount: 10000, kind: "payment" },
    { amount: 4000, kind: "refund" },
    { amount: 7000, kind: "payment" },
  ]);

  assert.deepEqual(summary, {
    grossSalesAmount: 17000,
    paymentCount: 2,
    refundedAmount: 4000,
    netSalesAmount: 13000,
  });
  ```

  Run: `pnpm --filter admin test`

  Expected: `summarizeSalesEvents`가 없어 FAIL.

- [ ] **Step 2: sales read model을 Supabase package에 구현한다**

  `getAdminSalesDashboard`는 `requireAdmin(client)` 후 두 query를 병렬 실행한다.
  - `payment_orders`: `paid_at >= from`, `paid_at < toExclusive`, provider 상태가 승인 이후 상태인 row와 `payment_links` 표시 필드.
  - `payment_refunds`: `status = succeeded`, `refunded_at >= from`, `refunded_at < toExclusive`, 원 주문과 링크 표시 필드.

  각 결제를 양수 payment event, 각 환불을 양수 refund event로 만든다. summary는 payment 합계와 refund 합계를 따로 계산한다. 일별 chart도 같은 event list를 `Asia/Seoul` 날짜 키로 묶는다. transaction 표에서는 환불 event만 음수 금액으로 표시한다.

  날짜 파서는 `YYYY-MM-DD`만 허용하고 종료일 다음 날 00:00 KST를 exclusive upper bound로 만든다. 시작일이 종료일보다 뒤이거나 366일을 넘으면 거절한다.

- [ ] **Step 3: 허위 정산 필드를 UI 계약에서 제거한다**

  `SalesSummaryCards`의 네 카드는 다음 순서로 바꾼다.
  1. 기간 순매출
  2. 총 승인액
  3. 결제 건수
  4. 환불액

  `SalesTransactionsTable` 열은 다음으로 바꾼다.

  ```text
  구분 | 상태 | 상품명 | 거래일자 | 거래금액 | 남은 환불가능액 | 영수증 | 환불
  ```

  `cardFee`, `settlementAmount`, `scheduled`, `settled`, `monthlyVisitorCount` 타입과 fixture를 삭제한다. 결제 상태는 `결제완료`, `부분환불`, `환불완료`, `확인중`; refund event는 `환불완료`로 표시한다.

- [ ] **Step 4: SalesPage가 기간별 실제 데이터를 로드한다**

  기본 기간은 오늘을 포함한 최근 30일이다. 기존 정적 기간 표시를 실제 `type="date"` 입력 두 개로 바꾸고, 값이 바뀌면 `getAdminSalesDashboard(supabase, range)`를 호출한다. loading, empty, error 상태를 기존 페이지 영역 안에서 표시한다. preview query param과 모든 fixture 분기를 제거한다.

- [ ] **Step 5: 매출 package와 UI 테스트를 통과시킨다**

  다음 계약을 자동 테스트한다.
  - 승인 2건과 환불 1건의 총 승인액·환불액·순매출.
  - 기간 밖 결제의 기간 내 환불이 해당 기간 환불액에 포함됨.
  - 같은 날짜 payment/refund 일별 합계.
  - 환불 가능 금액이 0인 payment row는 환불 버튼이 없음.
  - 화면에 `예정 정산 금액`, `카드수수료`, fixture가 남아 있지 않음.

  Run:

  ```bash
  pnpm --filter @repo/supabase test
  pnpm --filter admin test
  pnpm --filter admin build
  pnpm --filter admin lint
  ```

  Expected: 모두 exit 0.

- [ ] **Step 6: 실제 결제가 매출에 반영되는지 확인한다**

  Task 2에서 승인한 1,004원 거래가 다음과 같이 나타나는지 확인한다.
  - 총 승인액 1,004원
  - 결제 건수 1건
  - 환불액 0원
  - 순매출 1,004원
  - transaction row의 영수증 링크가 NICEPAY URL을 가리킴

---

### Task 4: 관리자 전액·부분환불

**Files:**

- Modify: `apps/user/lib/nicepay.ts`
- Create: `apps/user/app/api/admin/payments/[orderId]/refund/route.ts`
- Create: `apps/admin/src/lib/paymentApi.ts`
- Modify: `apps/admin/src/pages/SalesPage.tsx`
- Modify: `apps/admin/src/components/admin-sales/RefundDialog.tsx`
- Modify: `apps/admin/src/pages/salesData.ts`
- Modify: `apps/user/__tests__/nicepay.test.mjs`
- Create: `apps/user/__tests__/payment-refund.test.mjs`
- Modify: `apps/admin/tests/salesData.test.mjs`

**Interfaces:**

- `POST /api/admin/payments/:orderId/refund` consumes `{ requestId, amount, reason }`.
- Admin request includes `Authorization: Bearer <supabase access token>`.
- Success returns `{ status: "succeeded", refundedAmount, refundableAmount }`.
- Ambiguous provider result returns HTTP 202 with `{ status: "unknown" }`.
- Verified rejection returns HTTP 409 with `{ status: "failed", error }`.

- [ ] **Step 1: NICEPAY 취소 parser/client 테스트를 먼저 작성한다**

  `nicepay.test.mjs`에 취소 응답의 `cancelledTid`, `balanceAmt`, `cancels` parsing과 변조 서명 거절을 추가한다. 전액취소 request body에는 `cancelAmt`가 없고, 부분취소 request body에는 정수 `cancelAmt`가 포함되는지도 검증한다.

  Run: `pnpm --filter user test`

  Expected: cancel helper가 없어 FAIL.

- [ ] **Step 2: NICEPAY 일반 취소 helper를 구현한다**

  `NicepayPayment`에 다음 필드를 추가한다.

  ```ts
  type NicepayCancel = {
    amount: number;
    cancelledAt: string;
    reason: string;
    receiptUrl: string | null;
    tid: string;
  };

  type NicepayPayment = {
    balanceAmount: number;
    cancelledTid: string | null;
    cancels: readonly NicepayCancel[];
  };
  ```

  `cancelNicepayPayment(config, tid, { amount, fullAmount, orderId, reason })`는 `POST /v1/payments/{tid}/cancel`을 호출한다. `amount === fullAmount`이면 `cancelAmt`를 생략하고, 작으면 `cancelAmt`를 넣는다. 각 요청은 DB의 고유 `refund_order_id`를 `orderId`로 사용한다. 응답은 원 TID, 원 결제금액, signature, status, `balanceAmt`, `cancelledTid`를 모두 검증한다.

- [ ] **Step 3: 관리자 인증과 CORS를 refund route에 구현한다**

  route는 다음 순서로 인증한다.
  1. `Origin`이 `ADMIN_APP_URL`과 정확히 같은지 확인.
  2. `Authorization`이 단일 Bearer token인지 확인.
  3. server Supabase client의 `auth.getUser(token)`으로 서명된 현재 user를 조회.
  4. `user.app_metadata.role === 'admin'` 확인.

  `OPTIONS`는 허용 origin에만 `POST, OPTIONS`와 `Authorization, Content-Type`을 반환한다. DB 상태 변경은 인증된 user ID를 `requested_by`로 기록하지만 secret client로만 실행한다.

- [ ] **Step 4: refund route를 DB 예약 → 외부 호출 → DB 확정 순서로 구현한다**

  ```text
  parse/validate amount + reason + requestId
    → create_or_get_payment_refund RPC
    → existing succeeded/unknown이면 provider 재호출 없이 반환
    → NICEPAY cancel API 호출
    → signed response + balanceAmt 검증
    → finalize_payment_refund RPC
  ```

  NICEPAY 호출 timeout 뒤 거래 조회로 취소 사실을 검증할 수 없으면 refund를 `unknown`으로 저장하고 HTTP 202를 반환한다. `unknown` 금액은 환불 가능 금액에서 계속 예약되므로 같은 금액을 다시 환불할 수 없다.

- [ ] **Step 5: admin paymentApi와 RefundDialog를 실제 API에 연결한다**

  `paymentApi.ts`는 현재 Supabase session에서 access token을 읽고 `VITE_USER_APP_URL`의 refund endpoint를 호출한다.

  ```ts
  export async function refundPayment(
    paymentOrderId: string,
    input: { requestId: string; amount: number; reason: string },
  ): Promise<RefundPaymentResult>;
  ```

  dialog은 `crypto.randomUUID()`를 한 번 생성해 같은 제출 재시도에서 유지한다. 최대값은 원 거래금액이 아니라 `transaction.refundableAmount`를 사용한다. 사유 입력을 필수로 추가하고 submitting 동안 닫기·중복 제출을 막는다. 성공하면 dashboard를 다시 조회하며, 202이면 “환불 결과 확인 중” 상태를 표시하고 성공 문구를 보여주지 않는다.

- [ ] **Step 6: 환불 자동 테스트를 통과시킨다**

  다음을 검증한다.
  - 인증 없는 refund 요청은 401.
  - admin이 아닌 token은 403.
  - 허용되지 않은 Origin은 403.
  - 같은 requestId 두 번 요청은 NICEPAY cancel을 한 번만 호출.
  - 10,000원 결제에서 4,000원 환불 후 잔액은 6,000원.
  - 이어서 6,000원 전액환불 후 잔액은 0원, 주문은 `cancelled`.
  - 6,001원 추가 요청은 provider 호출 전에 409.
  - timeout은 `unknown`과 HTTP 202이며 추가 환불을 차단.

  Run:

  ```bash
  pnpm exec supabase test db --local
  pnpm --filter user test
  pnpm --filter user check-types
  pnpm --filter admin test
  pnpm --filter admin build
  ```

  Expected: 모두 exit 0.

- [ ] **Step 7: 샌드박스 부분·전액환불 체크포인트를 수행한다**

  10,000원 테스트 결제 한 건으로 다음을 순서대로 확인한다.
  1. 4,000원 부분환불 성공, NICEPAY `partialCancelled`, DB 잔액 6,000원.
  2. 매출 화면 환불액 4,000원, 순매출 6,000원.
  3. 남은 6,000원 환불 성공, NICEPAY `cancelled`, DB 잔액 0원.
  4. 매출 화면 누적 환불액 10,000원, 순매출 0원.
  5. 환불 버튼이 사라지고 원 LinkPay는 결제 불가 상태를 유지.

---

### Task 5: 웹훅 동기화, 수동 재확인, 출시 gate

**Files:**

- Modify: `apps/user/app/api/payments/nicepay/webhook/route.ts`
- Create: `apps/user/app/api/admin/payments/[orderId]/reconcile/route.ts`
- Modify: `apps/admin/src/lib/paymentApi.ts`
- Modify: `apps/admin/src/pages/SalesPage.tsx`
- Modify: `apps/admin/src/components/admin-sales/SalesTransactionsTable.tsx`
- Modify: `apps/user/__tests__/linkpay-payment.test.mjs`
- Modify: `apps/user/__tests__/payment-refund.test.mjs`
- Modify: `docs/linkpay-nicepay-integration.md`
- Modify: `apps/user/.env.example`
- Modify: `apps/admin/.env.example`

**Interfaces:**

- Verified webhook synchronizes order `balance_amount` and known cancellation rows.
- `POST /api/admin/payments/:orderId/reconcile` resolves one unknown payment/refund using NICEPAY transaction lookup.
- Admin sales rows in unknown state expose “상태 확인” instead of “환불”.

- [ ] **Step 1: 취소 웹훅 동기화 테스트를 작성한다**

  webhook 테스트에 다음을 추가한다.
  - 서명되지 않은 cancelled/partialCancelled webhook은 400.
  - 검증된 provider `cancels` 항목은 `nicepay_cancelled_tid` 기준으로 중복 없이 refund row에 반영.
  - 앱 밖 NICEPAY 관리자에서 발생한 취소도 refund 원장에 `succeeded`로 기록.
  - 늦은 `paid` webhook이 `cancelled` 또는 `partialCancelled` 주문을 `paid`로 되돌리지 않음.

- [ ] **Step 2: webhook이 원장과 잔액을 단조롭게 동기화하게 한다**

  검증된 provider response의 `cancels` 배열을 취소 TID 기준으로 upsert한다. 내부 requestId가 없는 외부 취소는 deterministic UUID를 임의 생성하지 않고 새 refund ID와 `RFWEBHOOK{cancelledTid}` refund order ID를 사용하며 `requested_by`에는 시스템 actor UUID 상수를 기록한다. `balanceAmt`가 기존 값보다 증가하거나 성공 환불 누계와 모순되면 자동 덮어쓰지 않고 주문을 `unknown`으로 잠근다.

- [ ] **Step 3: 단일 거래 수동 재확인 route를 구현한다**

  refund route와 동일한 관리자 인증·Origin 검증을 재사용 가능한 작은 server helper로 옮긴다. reconcile route는 NICEPAY 거래 조회 후 다음만 수행한다.
  - verified `paid`: 결제 완료 RPC 또는 잔액/취소 목록 동기화.
  - verified `failed`/`expired`: unresolved order를 해당 상태로 확정.
  - verified `cancelled`/`partialCancelled`: balance와 refund 목록 동기화.
  - 여전히 불명: DB를 바꾸지 않고 HTTP 202.

  이 route는 승인 API나 일반 취소 API를 다시 호출하지 않는다.

- [ ] **Step 4: 관리자 상태 확인 동작을 연결한다**

  `SalesTransactionsTable`에서 unknown payment/refund row에는 환불 버튼 대신 `상태 확인` 버튼을 표시한다. 클릭 시 reconcile endpoint를 호출하고 성공 후 dashboard를 reload한다. 202이면 “아직 NICEPAY에서 결과를 확인할 수 없습니다.” toast를 표시한다.

- [ ] **Step 5: 환경변수와 운영 문서를 확정한다**

  `apps/user/.env.example`에 다음 이름을 기록한다.

  ```dotenv
  NEXT_PUBLIC_SITE_URL=
  NICEPAY_MODE=sandbox
  NEXT_PUBLIC_NICEPAY_CLIENT_KEY=
  NICEPAY_SECRET_KEY=
  ADMIN_APP_URL=http://localhost:5173
  ```

  `apps/admin/.env.example`에는 다음을 유지/추가한다.

  ```dotenv
  VITE_SUPABASE_URL=
  VITE_SUPABASE_PUBLISHABLE_KEY=
  VITE_USER_APP_URL=http://localhost:3000
  ```

  `docs/linkpay-nicepay-integration.md`에는 NICEPAY 관리자에 production return URL과 webhook URL을 등록하고 webhook TEST 호출에서 정확한 `OK` 응답을 확인하는 절차를 적는다.

- [ ] **Step 6: 전체 자동 gate를 실행한다**

  Run:

  ```bash
  pnpm exec supabase db reset --local --no-seed
  pnpm exec supabase test db --local
  pnpm --filter @repo/supabase test
  pnpm --filter @repo/supabase check-types
  pnpm --filter @repo/supabase lint
  pnpm --filter user test
  pnpm --filter user check-types
  pnpm --filter user lint
  pnpm --filter admin test
  pnpm --filter admin build
  pnpm --filter admin lint
  rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages
  ```

  Expected: test/type/lint/build 명령은 모두 exit 0. 마지막 Figma URL 검색은 출력이 없어야 한다.

- [ ] **Step 7: 운영 소액 결제·환불 go/no-go를 수행한다**

  production key와 HTTPS URL로 100원 이상 허용되는 최소 금액의 실결제 한 건을 수행한다. 성공 callback, webhook, 매출 반영, 부분환불, 잔여 전액환불, refund webhook, 순매출 0원까지 같은 거래의 TID와 취소 TID로 대조한다. 다음 중 하나라도 실패하면 출시하지 않는다.
  - 브라우저 금액과 DB/NICEPAY 승인금액 불일치
  - callback 또는 webhook 서명 검증 실패
  - 중복 결제/환불 API 호출
  - unknown 상태에서 재결제 또는 추가 환불 가능
  - 환불 성공 후 매출 지표 미반영
  - NICEPAY 관리자 거래와 DB 잔액 불일치

## Deferred Scope

- NICEPAY 정산대사/입금대사 연동과 실제 카드 수수료·정산예정액
- 회계 분개, 세금계산서, 부가세 신고 자료
- 자동 cron reconciliation; 1차는 웹훅과 관리자 단건 재확인만 제공
- 카드 외 결제수단
- 관리자 다중 권한 체계; 현재 단일 `admin` role을 유지
- 별도 `payment_events` 원본 payload 저장; 세 테이블의 검증된 최종 필드만 보관

## Reference Documents

- NICEPAY Server 승인: `https://start.nicepay.co.kr/manual/quickguide/overview.do`
- NICEPAY 취소·부분취소·망취소: `https://github.com/nicepayments/nicepay-manual/blob/main/api/cancel.md`
- Supabase RLS: `https://supabase.com/docs/guides/database/postgres/row-level-security`
- Supabase Data API security: `https://supabase.com/docs/guides/api/securing-your-api`
- Flow diagram: `docs/superpowers/plans/2026-08-08-linkpay-sales-refunds.workflow.html`
