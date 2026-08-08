# LinkPay V2 MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자가 고정 금액 결제 링크를 발급하고, 고객이 NICEPAY 카드 결제를 한 번만 안전하게 완료하며, 서버 장부를 기준으로 결과 확인과 전액환불까지 처리한다.

**Architecture:** 기존 관리자 LinkPay 목록·입력 UI와 사용자 결제 화면의 디자인은 재사용하되, fixture와 기존 단순 `payment_orders` 흐름은 V2 장부로 교체한다. Supabase가 동시성·상태 전이·중복 방지를 강제하고, 관리자 mutation과 결제 처리는 인증된 Next.js Route Handler를 통과시켜 서버만 token derivation key, NICEPAY 비밀키, service-role 권한을 사용한다. 브라우저는 서버가 만든 주문 정보로 NICEPAY 인증창만 열며, 결제 결과 화면은 검증 후 DB에 저장된 상태만 표시한다.

**Tech Stack:** React 19, Next.js 16 App Router, Vite admin, TypeScript, Supabase/PostgreSQL, pgTAP, NICEPAY Start JS SDK 및 Server 승인 API

## Global Constraints

- 1차 범위는 KRW 고정금액 카드 결제, 링크당 성공 결제 1건, 실패 후 안전한 재시도, 전액환불 1건이다.
- 부분환불, 가상계좌, 정기결제, 일반 `/order` 결제, 매출·정산 통계는 제외한다.
- 금액·결제명·주문번호·결제 결과는 브라우저나 redirect query가 아니라 서버와 DB 값만 신뢰한다.
- `NICEPAY_SECRET_KEY`, service-role key, `authToken`, 카드정보, 원본 PG payload를 브라우저·DB·로그에 남기지 않는다.
- 결제 성공 여부가 불명확하면 재결제를 허용하지 않고 `RECONCILIATION_REQUIRED` 또는 `MANUAL_REVIEW`로 막은 뒤 거래 조회·망취소로 확인한다.
- 결제 시도가 한 번이라도 생기면 금액과 결제명 등 상업 필드는 수정·삭제하지 못한다.
- 결제 또는 환불된 링크는 다시 쓰지 않는다. 새 결제는 새 링크로 만든다.
- 모든 결제 테이블은 RLS를 활성화하고, `anon`·`authenticated`·`service_role` 권한은 migration에서 명시적으로 최소 부여한다.
- 관리자 mutation API는 Supabase access token의 `app_metadata.role`, `app_metadata.permissions`, 허용된 admin origin, 요청별 action을 서버에서 다시 검증한다. 전액환불은 `linkpay:refund` 권한이 필수다.
- 공개 링크 조회·시도 생성·callback은 token/IP/session별, 관리자 mutation은 actor별 rate limit을 적용한다.
- 고객 PII는 이름·전화·이메일·선택 회사명과 동의 문서 버전/시각만 저장하며, 운영 전 사업 담당자가 법적 근거·보관기간·삭제/익명화 방식을 승인한다.
- DB 함수는 외부 HTTP 호출을 하지 않는다. 행 잠금 transaction을 짧게 유지하고 NICEPAY 호출 전후를 별도 원자적 RPC로 나눈다.
- UI 작업 전 `design.md`를 다시 읽고, 공용 `Icon`, Pretendard GOV, parent `gap`, focus 규칙을 따른다.
- Figma MCP URL을 소스에 남기지 않으며 신규 이미지가 필요하면 `apps/user/public/figma-assets/`에 저장한다.

## Current Baseline

- 재사용: `apps/admin/src/pages/LinkPayPage.tsx`, `LinkPayFormPage.tsx`, `linkPayData.ts`의 목록·입력·복사 UX. 브라우저의 직접 mutation 방식은 서버 API 호출로 교체한다.
- 재사용: `apps/user/app/(site)/linkpay/[id]/LinkPayPaymentForm.tsx`와 결과 화면의 시각 구조.
- 교체: `apps/user/app/_content/linkPay.ts` fixture 및 `apps/user/app/(site)/linkpay/[id]/payment.ts`의 가짜 실패 처리.
- 교체: 기존 `payment_orders` 단일 주문 모델과 연결되지 않은 NICEPAY route를 V2 상태·임대권·복구 장부에 맞춘다.
- 기준 확인: Supabase 계약 테스트 24개와 관리자 LinkPay 테스트 9개는 통과한다. 사용자 전체 테스트의 기존 CSS 계약 실패 2개는 LinkPay 작업과 별도로 해소하거나 출시 전 명시적으로 판정한다.

## File Map

| File                                                                                 | Responsibility                                                   |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| `docs/linkpay-v2-cutover-inventory.md`                                               | 실제 Supabase와 기존 LinkPay route/RPC/secret의 전환 목록        |
| `package.json`, `pnpm-lock.yaml`, `supabase/config.toml`                             | Supabase CLI `2.112.0` 고정 및 로컬 DB/pgTAP 실행 환경           |
| `supabase/migrations/*_create_linkpay_v2_ledger.sql`                                 | V2 링크·시도·이벤트·환불·복구 작업, 제약, 인덱스, RLS, RPC       |
| `supabase/tests/linkpay_v2.sql`                                                      | 실제 PostgreSQL 상태 전이·권한·동시성 계약                       |
| `packages/supabase/src/types.ts`                                                     | V2 테이블·enum·RPC TypeScript 계약                               |
| `packages/supabase/src/paymentLinks.ts`                                              | 관리자 조회/변경 및 서버 checkout/refund/reconciliation helper   |
| `apps/user/lib/linkPayTokens.ts`                                                     | 공개 토큰과 checkout-session 생성·keyed hash·cookie 정책         |
| `apps/user/lib/nicepay.ts`                                                           | 엄격한 PG 입력 파싱, 서명 검증, 승인·조회·망취소·전액취소 client |
| `apps/user/app/(site)/linkpay/[id]/*`                                                | DB 기반 결제 페이지, NICEPAY 호출, 장부 기반 결과 페이지         |
| `apps/user/app/api/linkpay/[publicToken]/order/route.ts`                             | 고객정보/동의 검증 및 시도 생성·재사용                           |
| `apps/user/app/api/payments/nicepay/return/route.ts`                                 | 인증 callback 검증, 승인 lease 획득, 승인, 결과 확정             |
| `apps/user/app/api/payments/nicepay/webhook/route.ts`                                | 크기·서명·dedupe 검증과 단조 상태 동기화                         |
| `apps/user/app/api/jobs/linkpay-reconciliation/route.ts`                             | 만료·결과 불명 시도의 거래 조회·망취소 복구 worker               |
| `apps/user/app/api/admin/linkpay/route.ts`, `apps/user/app/api/admin/linkpay/[id]/*` | 인증된 관리자 생성·수정·공유 URL·비활성화·환불 API               |
| `apps/admin/src/lib/linkPayApi.ts`                                                   | admin access token과 고정 API origin을 사용하는 LinkPay client   |
| `apps/user/lib/linkPayObservability.ts`                                              | PII를 제외한 correlation ID·상태·결과 코드 기록과 운영 alert     |
| `apps/admin/src/pages/LinkPayPage.tsx`, `LinkPayFormPage.tsx`                        | V2 상태, 수정 잠금, 비활성화, 상세·전액환불 UI                   |
| `apps/user/__tests__/linkpay-v2-*.test.mjs`, `apps/admin/tests/linkPay*.test.mjs`    | route 보안 계약, 브라우저 흐름, 관리자 동작 회귀 테스트          |

---

### Task 1: 범위 확정과 전환 인벤토리

**Files:**

- Create: `docs/linkpay-v2-cutover-inventory.md`
- Reference: `docs/linkpay-v2-payment-flow.ko.md`
- Reference: `docs/linkpay-v2-payment-flow.en.md`

**Interfaces:**

- Produces: 배포된 테이블·정책·함수·route·웹훅·환경변수별 `keep | replace | retire` 판정표
- Produces: 카드만, 고정금액, 링크당 성공 1회, 전액환불만, 불명 상태 차단, 매출 통계 제외라는 승인된 MVP 경계

- [ ] **Step 1: 현재 원격 상태를 읽기 전용으로 수집한다**

  Supabase MCP의 project/table/migration 조회와 read-only SQL로 실제 `payment_links`, `payment_orders`, RLS, grants, triggers, functions를 기록한다. 비밀 값은 기록하지 않고 환경변수 이름과 배포 위치만 적는다.

- [ ] **Step 2: 기존 경로별 전환 처리를 문서화한다**

  아래 행을 모두 포함한다.

  | 대상                          | 처리                                      |
  | ----------------------------- | ----------------------------------------- |
  | 관리자 LinkPay 목록·입력 UI   | keep                                      |
  | `_content/linkPay.ts` fixture | replace                                   |
  | 기존 `payment_orders`와 RPC   | read-only 보존 후 retire                  |
  | 기존 return/webhook route     | V2 배포와 함께 replace                    |
  | NICEPAY callback/webhook 등록 | 고정 V2 HTTPS URL로 switch                |
  | 기존 미결제 UUID 공개 링크    | V2 token으로 재발급하고 기존 링크 disable |

- [ ] **Step 3: 현재 테스트 기준선을 저장한다**

  Run:

  ```bash
  pnpm --filter @repo/supabase test
  node --experimental-strip-types --test apps/admin/tests/linkPay*.test.mjs
  pnpm --filter user test
  ```

  Expected: Supabase 24개와 관리자 LinkPay 9개 통과. 사용자 테스트의 LinkPay 관련 테스트는 통과하고, 기존 비-LinkPay 실패는 파일·테스트명과 함께 인벤토리에 기록한다.

- [ ] **Step 4: 인벤토리를 커밋한다**

  ```bash
  git add docs/linkpay-v2-cutover-inventory.md
  git commit -m "docs(linkpay): inventory v2 cutover"
  ```

### Task 2: Supabase V2 장부와 원자적 상태 규칙

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `packages/supabase/package.json`
- Create via CLI: `supabase/config.toml`
- Create via CLI: `supabase/migrations/*_create_linkpay_v2_ledger.sql`
- Create: `supabase/tests/linkpay_v2.sql`
- Modify: `packages/supabase/src/types.ts`
- Modify: `packages/supabase/src/paymentLinks.ts`
- Modify: `packages/supabase/src/index.ts`
- Modify: `packages/supabase/tests/payment-links-contract.test.mjs`
- Modify: `packages/supabase/tests/content-helpers.test.mjs`
- Create: `packages/supabase/tests/linkpay-v2-concurrency.test.mjs`

**Interfaces:**

- Produces: `LinkStatus = ACTIVE | PAID | REFUNDED | DISABLED`
- Produces: `AttemptStatus = CREATED | APPROVAL_PENDING | RECONCILIATION_REQUIRED | MANUAL_REVIEW | PAID | FAILED | EXPIRED | REFUNDED`
- Produces RPCs: `create_or_reuse_payment_attempt`, `claim_payment_approval`, `finalize_payment_attempt`, `claim_reconciliation_job`, `create_or_get_full_refund`, `finalize_full_refund`
- `create_or_reuse_payment_attempt` returns `{ kind: "ready", attemptId, orderId, amount, status: "CREATED" } | { kind: "blocked", status: "APPROVAL_PENDING" | "RECONCILIATION_REQUIRED" | "MANUAL_REVIEW" }`.
- `claim_payment_approval` returns `{ claimed: true, fencingToken, leaseExpiresAt } | { claimed: false, status }`; `finalize_payment_attempt` requires the returned `fencingToken` and expected prior status.

- [ ] **Step 1: Supabase CLI와 로컬 테스트 환경을 고정한다**

  ```bash
  pnpm add -Dw supabase@2.112.0
  pnpm --filter @repo/supabase add -D postgres@3.4.9
  pnpm exec supabase init
  pnpm exec supabase migration new create_linkpay_v2_ledger
  pnpm exec supabase start
  ```

  기존 `supabase/` 파일은 보존하고 생성된 config와 migration 파일만 검토한다.

- [ ] **Step 2: 실패하는 pgTAP 계약을 작성한다**

  `supabase/tests/linkpay_v2.sql`에서 상태·제약·RLS를, `packages/supabase/tests/linkpay-v2-concurrency.test.mjs`에서 서로 다른 두 PostgreSQL connection의 경쟁 조건을 증명한다.
  - 다른 checkout-session 두 개가 동시에 요청해도 nonterminal attempt는 한 건이다.
  - 같은 session 재시도는 같은 `order_id`를 돌려준다.
  - `CREATED` 만료는 `EXPIRED`가 되고 새 시도를 허용한다.
  - 성공/환불 이력 전체에서 성공 charge는 링크당 한 건뿐이다.
  - 오래된 fencing token은 결과를 쓸 수 없다.
  - 첫 시도 이후 상업 필드 수정과 hard delete가 거절된다.
  - `anon`과 일반 `authenticated`는 시도·이벤트·환불·복구 작업을 읽거나 쓸 수 없다.

  Run: `pnpm exec supabase test db supabase/tests/linkpay_v2.sql --local`

  Run: `SUPABASE_DB_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres node --test packages/supabase/tests/linkpay-v2-concurrency.test.mjs`

  Expected: 새 테이블과 RPC가 없어서 FAIL.

- [ ] **Step 3: 전방향 migration을 구현한다**

  기존 migration은 고치지 않는다. 새 migration은 `payment_attempts`, `payment_events`, `payment_refunds`, `payment_reconciliation_jobs`와 `payment_links.v2_status`, `token_nonce`, `token_key_version`, `public_token_hash`를 expand 방식으로 추가한다. 기존 `status`와 `public_token`은 V2 traffic 전환이 끝날 때까지 legacy read-only 필드로 남긴다. 핵심 DB 제약은 다음과 같다.

  ```sql
  alter table public.payment_attempts
    add constraint payment_attempts_order_id_key unique (order_id);

  create unique index payment_attempts_one_blocking_link
    on public.payment_attempts (link_id)
    where status in (
      'CREATED', 'APPROVAL_PENDING',
      'RECONCILIATION_REQUIRED', 'MANUAL_REVIEW'
    );

  create unique index payment_attempts_one_successful_charge_link
    on public.payment_attempts (link_id)
    where status in ('PAID', 'REFUNDED');

  create unique index payment_events_source_dedupe_key
    on public.payment_events (source, dedupe_key);

  create unique index payment_links_public_token_hash_key
    on public.payment_links (public_token_hash)
    where public_token_hash is not null;

  alter table public.payment_refunds
    add constraint payment_refunds_original_attempt_id_key
    unique (original_attempt_id);
  ```

  모든 FK 열에 인덱스를 추가한다. link → attempt → refund 순으로 같은 잠금 순서를 사용하며 외부 API 호출 중에는 DB lock을 잡지 않는다. worker job claim은 `FOR UPDATE SKIP LOCKED`와 fencing token을 사용한다.

  기존 미결제 링크는 raw UUID를 새 token 계약으로 조용히 승격하지 않는다. 인벤토리에 기록한 뒤 `DISABLED`로 두고 관리자 API로 새 링크를 발급한다. 이미 결제된 링크는 `PAID` 이력으로만 보존한다.

- [ ] **Step 4: RLS와 grants를 최소 권한으로 설정한다**

  모든 결제 테이블에 RLS를 활성화하고 새 함수의 기본 `PUBLIC` 실행 권한을 즉시 revoke한다. 관리자 link CRUD에 필요한 명시적 `authenticated` 권한만 부여하고, 결제 상태 테이블과 RPC는 필요한 `service_role` 권한만 부여한다. 관리자 판정은 user metadata가 아니라 기존 `app_metadata.role`을 사용한다.

- [ ] **Step 5: TypeScript helper와 타입을 V2 계약으로 바꾼다**

  `packages/supabase/src/paymentLinks.ts`가 브라우저용 관리자 CRUD와 서버 전용 checkout/refund/reconciliation 함수를 분명한 이름으로 노출하게 한다. 서버 helper 입력에는 브라우저가 정한 amount, status, return URL을 받지 않는다.

- [ ] **Step 6: DB와 패키지 검증을 통과시킨다**

  ```bash
  pnpm exec supabase db reset --local --no-seed
  pnpm exec supabase test db supabase/tests/linkpay_v2.sql --local
  SUPABASE_DB_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres node --test packages/supabase/tests/linkpay-v2-concurrency.test.mjs
  pnpm --filter @repo/supabase test
  pnpm --filter @repo/supabase check-types
  pnpm --filter @repo/supabase lint
  ```

  Expected: 모두 exit 0. 이후 Supabase security/performance advisor에서 새 LinkPay 객체 관련 경고가 없어야 한다.

### Task 3: 공개 결제 화면과 NICEPAY 서버 승인 연결

**Files:**

- Create: `apps/user/lib/linkPayTokens.ts`
- Modify: `apps/user/lib/nicepay.ts`
- Modify: `apps/user/app/(site)/linkpay/[id]/page.tsx`
- Modify: `apps/user/app/(site)/linkpay/[id]/LinkPayPaymentForm.tsx`
- Delete after replacement: `apps/user/app/(site)/linkpay/[id]/payment.ts`
- Create: `apps/user/app/(site)/linkpay/[id]/result/page.tsx`
- Delete after result cutover: `apps/user/app/(site)/linkpay/[id]/success/page.tsx`
- Delete after result cutover: `apps/user/app/(site)/linkpay/[id]/fail/page.tsx`
- Modify: `apps/user/app/api/linkpay/[publicToken]/order/route.ts`
- Modify: `apps/user/app/api/payments/nicepay/return/route.ts`
- Modify: `apps/user/__tests__/nicepay.test.mjs`
- Create: `apps/user/__tests__/linkpay-v2-checkout.test.mjs`

**Interfaces:**

- Produces: `POST /api/linkpay/:publicToken/order` → `{ amount, clientId, goodsName, method, orderId, returnUrl } | { state: "blocked" }`
- Produces: `POST /api/payments/nicepay/return` → same-origin `303 /linkpay/:token/result`
- Produces: `GET /linkpay/:token/result` → DB 상태 기반 `success | failed | checking | manual-review`

- [ ] **Step 1: 실패하는 checkout·callback 테스트를 작성한다**

  금액 변조, 잘못된 token, 다른 session 동시 요청, 잘못된 callback content type/크기/서명/ID, 중복 callback, 승인 timeout, 오래된 fencing token을 검사한다. `success` query만 붙여 결제 성공 화면을 만들 수 없음을 검증한다.

- [ ] **Step 2: 공개 token과 checkout cookie 경계를 구현한다**

  링크마다 128-bit CSPRNG `token_nonce`를 만들고, 서버 secret key와 `link_id + token_nonce + token_key_version`으로 256-bit URL token을 HMAC-SHA-256 파생한다. DB에는 nonce, key version, 별도 lookup key로 만든 `public_token_hash`만 저장한다. 따라서 서버는 관리자 복사와 callback redirect 때 같은 URL을 다시 파생할 수 있지만 DB 유출만으로 token을 복원할 수 없다. checkout-session은 별도 CSPRNG 값의 hash만 저장하고 cookie는 `Secure`, `HttpOnly`, `SameSite=Lax`, LinkPay 경로 범위, 15분 만료로 설정한다. 결제·결과 페이지에는 `Referrer-Policy: no-referrer`와 `noindex`를 적용한다.

- [ ] **Step 3: 사용자 페이지를 fixture에서 DB 조회로 바꾼다**

  유효 token이면 최소 표시 필드만 렌더링하고 `PAID`/`REFUNDED`는 결과 화면, `DISABLED`는 사용 불가 화면으로 보낸다. 폼 제출은 이름·전화·이메일·선택 회사명과 동의 문서 버전만 서버에 보내며 amount/status/orderId를 보내지 않는다.

- [ ] **Step 4: 서버 주문 생성 후 NICEPAY SDK를 호출한다**

  order route가 `create_or_reuse_payment_attempt` 결과와 DB snapshot으로 결제 파라미터를 만들고, client component가 `https://pay.nicepay.co.kr/v1/js/`의 `AUTHNICE.requestPay()`를 호출한다. `method`는 `card`, `returnUrl`은 token이나 사용자 입력을 포함하지 않는 고정 HTTPS same-origin URL이다.

- [ ] **Step 5: callback을 검증하고 승인 소유권을 한 번만 잡는다**

  16 KiB 이하 form body와 예상 encoding만 받고, `authResultCode`, client ID, order ID, amount, TID, `SHA-256(authToken + clientId + amount + SecretKey)`를 timing-safe 비교한다. 성공 callback은 짧은 DB transaction으로 approval lease와 fencing token을 획득한 요청만 NICEPAY 승인 API를 한 번 호출하게 한다.

- [ ] **Step 6: 승인 응답을 검증한 뒤 장부를 확정한다**

  응답의 TID, order ID, amount, status, result code, `SHA-256(tid + amount + ediDate + SecretKey)`를 검증한다. 검증된 `paid`만 `PAID`, 검증된 `failed/cancelled`만 `FAILED`로 기록한다. timeout·빈 응답·불일치는 먼저 durable reconciliation job을 만든 뒤 결과 화면에 `checking`을 표시한다.

- [ ] **Step 7: 사용자 앱 검증을 통과시킨다**

  ```bash
  node --test --test-name-pattern="LinkPay|NICEPAY|payment|callback|webhook" apps/user/__tests__/*.test.mjs
  pnpm --filter user check-types
  pnpm --filter user lint
  ```

  Expected: 모두 exit 0.

### Task 4: 웹훅, 복구 worker, 관리자 전액환불

**Files:**

- Modify: `apps/user/app/api/payments/nicepay/webhook/route.ts`
- Create: `apps/user/app/api/jobs/linkpay-reconciliation/route.ts`
- Create: `apps/user/app/api/admin/linkpay/[id]/refund/route.ts`
- Create: `apps/user/app/api/admin/linkpay/route.ts`
- Create: `apps/user/app/api/admin/linkpay/[id]/route.ts`
- Create: `apps/user/app/api/admin/linkpay/[id]/share/route.ts`
- Create: `apps/user/app/api/admin/linkpay/[id]/reconcile/route.ts`
- Create: `apps/admin/src/lib/linkPayApi.ts`
- Create: `apps/user/lib/linkPayObservability.ts`
- Modify: `apps/admin/src/pages/LinkPayPage.tsx`
- Modify: `apps/admin/src/pages/LinkPayFormPage.tsx`
- Modify: `apps/admin/src/pages/linkPayData.ts`
- Create: `apps/user/__tests__/linkpay-v2-recovery.test.mjs`
- Create: `apps/user/__tests__/linkpay-v2-refund.test.mjs`
- Modify: `apps/admin/tests/linkPayPage.test.mjs`
- Modify: `apps/admin/tests/linkPayFormPage.test.mjs`

**Interfaces:**

- Produces: verified/deduplicated NICEPAY webhook acknowledgement `200 text/html OK`
- Produces: fenced reconciliation job claim and monotonic resolution
- Produces: authorized idempotent full-refund operation returning one durable refund record

- [ ] **Step 1: 실패하는 webhook·복구·환불 테스트를 작성한다**

  64 KiB 초과 JSON, duplicate key, 잘못된 서명/금액/ID/TID, 동일 webhook 재전송, 순서가 뒤집힌 terminal event, 승인 timeout 후 망취소, refund 동시 요청, 부분취소 divergence를 검사한다.

- [ ] **Step 2: webhook을 엄격하고 idempotent하게 만든다**

  raw body를 64 KiB에서 끊고 중복 JSON key를 거절한 뒤 공식 서명과 저장된 거래 정보를 모두 검증한다. 다음 UTF-8 canonical string의 SHA-256을 dedupe key로 사용하고 `(source, dedupe_key)` unique event를 상태 변경과 같은 transaction에 기록한다.

  ```text
  nicepay-webhook:v1
  tid=<tid>
  orderId=<orderId>
  status=<status>
  resultCode=<resultCode>
  cancelledTid=<cancelledTid-or-empty>
  ediDate=<ediDate>
  amount=<base-10 integer>
  balanceAmt=<base-10 integer>
  ```

  DB commit이 성공한 뒤에만 정확히 HTTP 200, `text/html`, `OK`를 반환한다. `partialCancelled`나 외부 취소는 자동으로 전액환불 완료 처리하지 않고 hold와 alert를 남긴다.

- [ ] **Step 3: durable reconciliation worker를 구현한다**

  worker는 만료된 `CREATED`를 `EXPIRED`로 바꾸고, `APPROVAL_PENDING` 만료와 `RECONCILIATION_REQUIRED` job을 `SKIP LOCKED`로 claim한다. 승인 API는 다시 호출하지 않고 1시간 이내 망취소와 거래 조회만 수행한다. 확인되지 않으면 `MANUAL_REVIEW`로 전환하고 새 결제를 계속 막는다. 최근 `PAID`/`REFUNDED`도 제한된 기간 동안 조회해 누락 웹훅과 외부 취소를 탐지한다. `linkpay:reconcile` 권한의 단건 reconcile route는 같은 fenced job만 실행하며 DB 상태를 직접 덮어쓰지 않는다.

- [ ] **Step 4: 전액환불을 한 번만 실행한다**

  관리자 access token을 서버에서 검증하고 환불 사유를 필수로 받는다. `UNIQUE(original_attempt_id)` refund row를 처음 만든 요청만 NICEPAY 전액취소 API를 호출한다. 원 거래 ID/TID, 서명, `cancelled`, 잔액 0을 모두 확인한 뒤 refund·attempt·link를 한 transaction에서 `SUCCEEDED/REFUNDED`로 바꾼다.

- [ ] **Step 5: 관리자 UI를 V2 상태와 잠금 규칙에 맞춘다**

  직접 Supabase mutation을 `apps/admin/src/lib/linkPayApi.ts` 호출로 바꾼다. API는 bearer access token을 `auth.getUser()`로 검증하고 `app_metadata.role === "admin"`, action별 permission, 허용 origin을 확인한다. CORS는 정확한 `ADMIN_APP_ORIGIN` 한 개와 필요한 method/header만 허용하고 wildcard를 사용하지 않는다. `ACTIVE`, 처리 중, `PAID`, `REFUNDED`, `DISABLED`, `MANUAL_REVIEW`를 구분하고, 첫 시도 이후 수정/삭제 버튼을 없애고 비활성화만 제공한다. 공유 버튼은 서버가 파생한 URL을 반환하며, 환불 버튼은 `linkpay:refund` 권한·결제 완료·hold 없음일 때만 보인다. 결과는 toast만 믿지 않고 재조회한 DB 상태로 표시한다.

- [ ] **Step 6: 복구와 관리자 테스트를 통과시킨다**

  ```bash
  node --test --test-name-pattern="LinkPay|NICEPAY|payment|callback|webhook|refund|reconciliation" apps/user/__tests__/*.test.mjs
  node --experimental-strip-types --test apps/admin/tests/linkPay*.test.mjs
  pnpm --filter admin build
  ```

  Expected: 모두 exit 0.

### Task 5: 샌드박스, 보안, 출시 검증

**Files:**

- Modify: `apps/user/.env.example`
- Modify: `turbo.json`
- Create: `docs/linkpay-v2-runbook.md`

**Interfaces:**

- Produces: 환경별 key/URL 설정표, 장애·manual-review·rollback runbook, 운영 Go/No-Go 체크리스트

- [ ] **Step 1: 환경변수와 provider URL을 고정한다**

  `NICEPAY_MODE`, 공개 Client Key, 서버 Secret Key, 고정 site origin, admin origin, versioned token derivation key, token lookup key, job secret을 sandbox/production 환경별로 분리한다. NICEPAY 관리자에는 V2 return/webhook HTTPS URL만 등록한다. 배포 scheduler는 `CRON_SECRET`으로 보호된 reconciliation route를 1분마다 호출한다. `docs/linkpay-v2-runbook.md`에는 PII 조회 권한, 보관기간 종료 시 익명화, 정보주체 삭제 요청, operator 수동 대사 절차를 포함한다.

- [ ] **Step 2: 자동 검증 전체를 실행한다**

  ```bash
  pnpm exec supabase db reset --local --no-seed
  pnpm exec supabase test db supabase/tests/linkpay_v2.sql --local
  pnpm --filter @repo/supabase test
  pnpm --filter @repo/supabase check-types
  pnpm --filter admin test
  pnpm --filter admin build
  pnpm --filter user test
  pnpm --filter user check-types
  pnpm --filter user lint
  pnpm --filter user build
  rg "NICEPAY_SECRET_KEY|SUPABASE_SECRET_KEY" apps/user/app apps/user/components -g '*.tsx'
  rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages
  ```

  Expected: 모든 build/type/lint/DB/LinkPay 테스트 통과. secret 이름은 server-only 파일 외 Client Component와 응답 코드에서 0건, Figma API URL은 0건.

- [ ] **Step 3: NICEPAY sandbox 시나리오를 실행한다**

  정상 카드결제, 고객 인증 취소, 변조 callback, 중복 callback, 다른 브라우저 동시 결제, webhook 재전송, 승인 timeout 복구, 전액환불, 중복환불, 최종 거래 조회를 실행한다. NICEPAY와 DB의 order ID·TID·금액·상태가 모두 일치해야 한다.

- [ ] **Step 4: rollback과 운영 관측을 검증한다**

  rollback은 신규 V2 결제 시작만 막고 기존 return/webhook/reconciliation은 유지한다. deployment WAF/API rate limit이 공개 link read·attempt creation·callback과 관리자 mutation에 적용됐는지 확인한다. invalid signature, 중복 시도, 망취소 실패, 복구 deadline, `MANUAL_REVIEW`, 외부/부분취소에 alert가 발생하는지 확인한다.

- [ ] **Step 5: 소액 운영 결제와 전액취소 후 출시한다**

  고정 운영 도메인과 운영 key로 소액 1건을 승인하고 동일 거래를 전액취소한다. NICEPAY 관리자·DB·사용자 결과·관리자 상태가 모두 일치할 때만 LinkPay 생성 링크를 고객에게 공개한다.

## References

- `docs/linkpay-v2-payment-flow.ko.md`
- `docs/linkpay-v2-payment-flow.en.md`
- [NICEPAY Server 승인 결제창·승인 API](https://github.com/nicepayments/nicepay-manual/blob/main/api/payment-window-server.md)
- [NICEPAY 웹훅](https://github.com/nicepayments/nicepay-manual/blob/main/api/hook.md)
- [NICEPAY 통신 timeout 준비사항](https://github.com/nicepayments/nicepay-manual/blob/main/common/preparations.md)
- [Supabase Data API 보안과 명시적 grants](https://supabase.com/docs/guides/api/securing-your-api)
