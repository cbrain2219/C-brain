# 2. 사용자 상품 데이터 연동 Implementation Plan

> **Status: PAUSED — DO NOT EXECUTE.** 선행 DB 계획이 최신 UI 계약에 맞게 다시 작성될 때까지 보류한다. 현재 활성 계획은 [관리자 상품 상세 UI 전환 계획](./2026-08-06-admin-product-detail-ui.md)이다.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Depends on:** [1. 관리자 상품 및 DB 구조 전환](./2026-08-06-admin-product-db-conversion.md)이 배포되고, 공개할 상품의 `configuration`이 관리자에서 검수·저장되어 있어야 한다.

**Goal:** 사용자 홈과 주문 화면의 하드코딩된 상품·옵션·가격을 제거하고, Supabase의 공개 상태 상품을 읽어 여섯 고정 카테고리의 카드, 옵션, 주문 요약에 연결한다. 결제 직전에는 서버가 상품을 다시 조회해 금액을 재계산한다.

**Architecture:** Next.js 서버 컴포넌트가 anon 권한으로 공개 상품만 조회하고, 순수 변환 함수가 `configuration`을 직렬화 가능한 주문 카탈로그로 바꾼 뒤 기존 클라이언트 UI에 props로 전달한다. 상품 설명·아이콘·URL slug 같은 표현 메타데이터만 코드에 남기고, 공개 여부·옵션·수량·단가·견적은 DB를 원본으로 사용한다. 서버 액션은 브라우저가 보낸 합계를 신뢰하지 않고 `productId`로 최신 공개 행을 다시 조회해 선택값과 금액을 검증한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.9, Supabase/Postgres RLS, Node test runner, CSS Modules

## Phase Boundary

| 구분 | 1단계: 관리자 및 DB 구조 | 2단계: 사용자 데이터 연동 |
| --- | --- | --- |
| DB | `configuration jsonb`, 고정 유형 제약, 레거시 호환 | 공개 조회에 필요한 컬럼 grant만 추가 |
| 관리자 | 유형별 입력·검증·저장 | 수정하지 않음 |
| 사용자 홈 | 수정하지 않음 | 공개 상품 기반 카드 가격·가용성 |
| 사용자 주문 | 수정하지 않음 | 옵션·수량·요약을 `configuration`에 연결 |
| 결제 검증 | 기존 정적 데이터 유지 | 최신 DB 행으로 서버 재검증 |

## Global Constraints

- 여섯 고정 유형은 `브로슈어 · 카탈로그`, `리플렛 · 팜플렛`, `포스터 · 전단지`, `배너 · 족자 · 현수막`, `명함 · 봉투`, `로고`다.
- DB가 원본인 값은 공개 여부, 상품명/하위 유형, 옵션, 수량별 단가, 디자인·인쇄 견적, 기획 견적이다. 아이콘, 소개 문구, 고정 유형별 수량 단위는 표현 메타데이터로 코드에 남긴다.
- `status = 'published'`인 행만 사용자에게 노출한다. `draft` 또는 알 수 없는 레거시 유형은 주문 카탈로그에 넣지 않는다.
- 브로슈어형과 로고형은 한 고정 유형에 공개 행이 하나만 있어야 한다. 하위 유형이 있는 규격형은 `(type, configuration.subtype)`마다 공개 행이 하나만 있어야 한다. 중복은 임의로 첫 행을 고르지 않고 해당 선택지를 바로 주문 불가로 처리한다.
- 설정이 없거나 잘못된 상품, DB 조회 실패, 환경변수 누락에는 정적 가격으로 되돌아가지 않는다. 잘못된 금액으로 결제되는 것보다 상담 주문으로 닫히는 것이 우선이다.
- `패키지 · 쇼핑백`, `촬영`, `기타`는 DB 직결 상품이 아니라 기존과 같이 상담 상품으로 유지한다.
- 수량이 있는 상품의 기존 금액 규칙 `수량 × 단가 + 선택 기획비`는 바꾸지 않는다. `로고`는 수량 행이 없으므로 `design_print_estimate`를 기본 합계로 사용하고 기획 선택을 표시하지 않는다.
- 옵션 키는 가격 축이 아니다. 현재 `configuration.quantityPrices`가 수량별 단가만 저장하므로 페이지·용지·재질 등은 선택값으로 검증·표시하되 단가를 다시 조합하지 않는다.
- 사용자에게 admin 전체 행이나 service-role key를 전달하지 않는다. 공개용 anon 클라이언트와 명시적 컬럼 select만 사용한다.
- UI를 수정하기 전에 `design.md`를 다시 읽고 기존 컴포넌트 동작과 반응형 레이아웃을 유지한다. 이 단계는 새 Figma 화면을 만드는 작업이 아니다.
- 프로덕션 Supabase에 구현 과정에서 직접 push하지 않는다. 마이그레이션은 로컬 또는 개발 DB에서 검증한 뒤 별도 배포한다.
- 구현 완료 전 `rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages`가 매치 없이 종료되어야 한다.

---

## Confirmed Current State

- `apps/user/app/_content/order.ts`가 일곱 개 상품과 옵션·가격을 모두 정적으로 만든다. 여기에 새 고정 유형에 없는 `package-shopping-bag`도 직접 주문 상품으로 들어 있다.
- `apps/user/app/_content/services.ts`와 `apps/user/app/_components/ServicesSection.tsx`가 서비스 카드 데이터를 각각 따로 갖고 있어 홈과 주문 화면의 가격이 DB 변경을 따라가지 않는다.
- `apps/user/app/(site)/order/page.tsx`는 전체가 클라이언트 컴포넌트이며, `getDirectServiceItemById`와 `getOrderOptionConfig`가 전역 정적 카탈로그를 읽는다.
- `OrderOptionSelection.tsx`는 페이지, 용지, 수량, 기획이 항상 존재한다고 가정하므로 두께·코팅·카테고리·사이즈·재질과 수량이 없는 로고를 표현할 수 없다.
- `payment.ts`는 클라이언트 합계를 정적 카탈로그로 재계산하지만 최신 DB 상품은 조회하지 않는다.
- `packages/supabase/src/products.ts`의 공개 조회는 `id, name, sort_order, type, unit_prices`만 선택하며 anon grant도 같은 레거시 컬럼에 한정돼 있다.
- 1단계 조사 시 실제 데이터에는 같은 책자형으로 매핑될 공개 행이 둘 이상 있고 공개 로고 행은 없었다. 2단계 배포 전 관리자에서 대표 공개 행을 정리하고 로고의 공개 여부를 결정해야 한다.

## User-facing Contract

```ts
export type DirectOrderServiceId =
  | 'brochure-catalog'
  | 'leaflet-pamphlet'
  | 'poster-flyer'
  | 'banner-display'
  | 'business-card-envelope'
  | 'logo'

export type OrderOptionGroup = {
  id: ProductOptionKey
  label: string
  choices: ReadonlyArray<{ id: string; label: string }>
}

export type OrderProductConfig = {
  designPrintEstimate: number
  optionGroups: ReadonlyArray<OrderOptionGroup>
  planningEstimate: number | null
  productId: string
  quantityPrices: ReadonlyArray<{
    id: string
    quantity: number
    unitPrice: number
  }>
  quantityUnit: '부' | '개' | null
  serviceId: DirectOrderServiceId
  subtype: string | null
  type: ProductType
}

export type OrderCatalog = {
  configurationsByProductId: Record<string, OrderProductConfig>
  services: ReadonlyArray<ServiceItem>
}
```

`ServiceItem.id`는 URL에 쓰는 안정적인 여섯 slug를 유지한다. 실제 DB UUID는 `productId`로 별도 보관한다. 규격형에서 공개 하위 유형이 여러 개면 옵션 화면의 첫 선택 그룹으로 표시하고, 상품을 바꿀 때 그 상품의 옵션과 수량 기본값으로 초기화한다.

---

### Task 1: Expose only the published product fields needed by the user app

**Files:**
- Create via Supabase CLI: `supabase/migrations/*_expose_product_configuration.sql`
- Modify: `packages/supabase/src/products.ts`
- Modify: `packages/supabase/tests/content-helpers.test.mjs`
- Create: `packages/supabase/tests/product-public-contract.test.mjs`

**Interfaces:**
- Consumes: 1단계의 `products.configuration`과 기존 `public select published products` RLS 정책
- Produces: 확장된 `PublicProduct`, `listPublishedProducts`, `getPublishedProduct`

- [ ] **Step 1: Write failing public-query tests**

Update the fake-client assertions so the list query must select exactly these fields and retain stable ordering:

```ts
const publicProductColumns = [
  'id',
  'name',
  'sort_order',
  'type',
  'configuration',
  'design_print_estimate',
  'planning_estimate',
].join(', ')
```

Add a test for `getPublishedProduct(client, id)` asserting both `.eq('status', 'published')` and `.eq('id', id)` occur before `.maybeSingle()`.

- [ ] **Step 2: Write the failing migration contract test**

The test locates `*_expose_product_configuration.sql` and asserts:

- anon table-level select is revoked before the column grant;
- the grant contains only `id`, `name`, `status`, `type`, `sort_order`, `configuration`, `design_print_estimate`, and `planning_estimate`;
- the published-row RLS policy remains present;
- there is no service-role grant and no public `select *` path.

- [ ] **Step 3: Run the package tests and confirm failure**

Run:

```bash
pnpm --filter @repo/supabase test
```

Expected: FAIL because the migration, expanded query, and single-product helper do not exist.

- [ ] **Step 4: Generate and implement the grant migration**

Run:

```bash
pnpm dlx supabase migration new expose_product_configuration
```

Use the generated filename unchanged, then add:

```sql
revoke select on public.products from anon;

grant select (
  id,
  name,
  status,
  type,
  sort_order,
  configuration,
  design_print_estimate,
  planning_estimate
) on public.products to anon;
```

Do not replace the existing RLS policy with an unrestricted policy. The query must still be limited to `status = 'published'` rows.

- [ ] **Step 5: Expand the public helper contract**

In `packages/supabase/src/products.ts`:

- expand `PublicProduct` to the seven returned fields;
- use a shared `publicProductColumns` literal for list and detail queries;
- keep `.order('sort_order').order('id')` on the list;
- add `getPublishedProduct(client, id)` returning one published row or `null`;
- never use `.select('*')` for either public helper.

- [ ] **Step 6: Run package tests, types, and lint**

Run:

```bash
pnpm --filter @repo/supabase test
pnpm --filter @repo/supabase check-types
pnpm --filter @repo/supabase lint
```

Expected: PASS.

- [ ] **Step 7: Commit the public data contract**

```bash
git add supabase/migrations packages/supabase/src/products.ts packages/supabase/tests/content-helpers.test.mjs packages/supabase/tests/product-public-contract.test.mjs
git commit -m "feat: expose published product configuration"
```

---

### Task 2: Convert published rows into a runtime order catalog

**Files:**
- Modify: `apps/user/app/_content/order.ts`
- Modify: `apps/user/app/_content/services.ts`
- Create: `apps/user/__tests__/order-product-data.test.mjs`
- Modify: `apps/user/__tests__/order-page.test.mjs`

**Interfaces:**
- Consumes: `ReadonlyArray<PublicProduct>` and 1단계 `ProductConfiguration` JSON contract
- Produces: `createOrderCatalog(products)`, `getOrderOptionConfig(catalog, productId)`, `calculateOrderSelection(config, selection)`

- [ ] **Step 1: Add failing adapter tests for all three profiles**

Cover these fixtures with pure data and no network calls:

1. 책자형 exposes page, paper, thickness, coating in profile order and uses `부`.
2. 규격형 exposes category, size, material, uses the configured subtype, and chooses `부` or `개` from the fixed type.
3. 로고 exposes category, size, material, has no planning or quantity group, and prices one order at `design_print_estimate`.
4. Unknown type, malformed JSON, empty required option group, duplicate null subtype, and duplicate `(type, subtype)` are excluded from direct payment.
5. Draft rows never reach the adapter because the package query filters them.

- [ ] **Step 2: Add failing price and tamper-validation tests**

The pure calculation helper must:

- accept only option IDs present in every visible group;
- accept only a quantity row present in `configuration.quantityPrices`;
- calculate quantity products as `quantity * unitPrice + optional planning_estimate`;
- reject planning for a profile where planning is hidden;
- calculate logo as `design_print_estimate` with no quantity ID;
- return `null` for a stale/unknown product, option, subtype, or quantity rather than accepting client labels or amounts.

- [ ] **Step 3: Run focused tests and confirm failure**

Run:

```bash
pnpm --dir apps/user exec node --experimental-strip-types --test __tests__/order-product-data.test.mjs
```

Expected: FAIL because the runtime catalog and generic calculation helpers do not exist.

- [ ] **Step 4: Keep only fixed presentation metadata in source**

Replace the hardcoded product fixtures with one exhaustive map keyed by fixed product type:

```ts
const productPresentation = {
  '브로슈어 · 카탈로그': {
    serviceId: 'brochure-catalog',
    icon: 'book-open',
    description: '기업소개, 제품 카탈로그 등 핵심 홍보물. 기획부터 인쇄까지 원스톱',
    quantityUnit: '부',
  },
  // remaining five types
} as const satisfies Record<ProductType, ProductPresentation>
```

Labels for option keys also stay in one small map: page/페이지 수, paper/용지, thickness/두께, coating/표지 코팅, category/카테고리, size/사이즈, material/재질.

- [ ] **Step 5: Implement guarded `configuration` parsing**

Validate before rendering:

- object shape and `version === 1`;
- fixed product type and allowed subtype for that type;
- strings are trimmed, non-empty, and de-duplicated;
- every profile-required option key has at least one choice;
- quantities and unit prices are finite positive integers with no duplicate quantity;
- non-logo profiles have at least one quantity row;
- logo has no quantity rows and no planning control.

Do not infer missing canonical values from legacy arrays here. An incomplete row stays 상담-only until an administrator saves a valid configuration in 1단계.

- [ ] **Step 6: Build the grouped catalog**

- Group valid rows by the six fixed types.
- Use the stable service slug for URLs and retain every distinct valid subtype as a selectable product variant.
- For profiles without subtypes, accept one public row only; multiple rows mark the group ambiguous and 상담-only.
- For subtype profiles, accept at most one row per subtype; exclude ambiguous duplicate subtypes.
- Show the lowest `design_print_estimate` among valid variants as the card's `~` price.
- Append the three static consultation cards after the six fixed categories.
- Change `getDirectServiceItemById` and `getOrderOptionConfig` to receive the runtime catalog instead of reading module globals.

- [ ] **Step 7: Remove static commercial data**

Delete `createAdminOrderProduct`, `createAdminUnitPrices`, `orderProductRegistrations`, and the static `orderOptionCatalog`. A source-contract test must fail if the removed fixture names or hardcoded numeric price arrays return.

- [ ] **Step 8: Run adapter tests and type checking**

Run:

```bash
pnpm --dir apps/user exec node --experimental-strip-types --test __tests__/order-product-data.test.mjs
pnpm --filter user check-types
```

Expected: PASS.

- [ ] **Step 9: Commit the runtime catalog**

```bash
git add apps/user/app/_content/order.ts apps/user/app/_content/services.ts apps/user/__tests__/order-product-data.test.mjs apps/user/__tests__/order-page.test.mjs
git commit -m "feat: build order catalog from products"
```

---

### Task 3: Load the catalog on the server and pass it into existing client UI

**Files:**
- Modify: `apps/user/lib/supabase.ts`
- Modify: `apps/user/app/(site)/page.tsx`
- Modify: `apps/user/app/_components/ServicesSection.tsx`
- Modify: `apps/user/app/_components/ServiceCards.tsx`
- Modify: `apps/user/app/(site)/order/page.tsx`
- Create: `apps/user/app/(site)/order/OrderPageClient.tsx`
- Modify: `apps/user/app/(site)/order/OrderFlowSection.tsx`
- Modify: `apps/user/__tests__/services-section.test.mjs`
- Modify: `apps/user/__tests__/order-page.test.mjs`

**Interfaces:**
- Consumes: `listPublishedProducts(createPublicSupabaseClient())`
- Produces: serializable `OrderCatalog` props for home and order client components

- [ ] **Step 1: Add failing server-boundary tests**

Assert the new structure:

- `order/page.tsx` is an async server component without `useState`, `useEffect`, `window`, or `"use client"`;
- `OrderPageClient.tsx` owns the existing state and browser effects;
- home and order routes call the same public product loader;
- `ServicesSection`, `ServiceCards`, and `OrderFlowSection` receive services/catalog via props and do not import a global `services` array;
- only serializable plain data crosses the server/client boundary.

- [ ] **Step 2: Add a cookie-free public client**

In `apps/user/lib/supabase.ts`, keep `createUserSupabaseClient()` for authenticated/session-aware flows and add `createPublicSupabaseClient()` using the publishable key with an empty cookie store. Return `null` when public env vars are absent. Never use an admin/service-role client.

- [ ] **Step 3: Add one small server loader**

Create a server-only helper close to the routes, or in `apps/user/lib/products.ts` if both routes need it:

```ts
export type PublicOrderCatalogResult = {
  catalog: OrderCatalog
  isAvailable: boolean
}
```

It should create the public client, call `listPublishedProducts`, and return a consultation-only catalog with `isAvailable: false` on missing env or query error. Log the technical error on the server; show users one neutral availability message without leaking database details.

- [ ] **Step 4: Split the order page at the server/client boundary**

- Make `order/page.tsx` fetch the catalog and render `OrderPageClient`.
- Move the current router, state, query-string initialization, body dataset, and event handlers unchanged into `OrderPageClient.tsx`.
- Resolve `?service=<slug>` against the catalog passed as props.
- If a slug is absent, 상담-only, or no longer published, remain on category selection instead of selecting stale data.

- [ ] **Step 5: Pass runtime services through the order component tree**

Thread props through `OrderPageClient` → `OrderFlowSection` → `ServiceCards` and pass the selected service plus catalog to `OrderOptionSelection`. Do not add context or a state-management library for this single route.

- [ ] **Step 6: Connect the landing service cards**

- Fetch the same published list in `apps/user/app/(site)/page.tsx`.
- Pass the resulting `services` to `ServicesSection`.
- Remove its second hardcoded nine-card array.
- Preserve the existing card order, icons, descriptions, consultation dialog, and URLs.
- A fixed category with no valid public configuration opens consultation instead of showing a stale direct-order price.

- [ ] **Step 7: Show the fail-closed state**

When `isAvailable` is false, keep all categories visible but disable direct pricing and route clicks, label them `상담 후 견적`, and show one concise notice that live pricing is temporarily unavailable. Do not silently render the previous fixture amounts.

- [ ] **Step 8: Run user tests, types, and lint**

Run:

```bash
pnpm --filter user test
pnpm --filter user check-types
pnpm --filter user lint
```

Expected: PASS.

- [ ] **Step 9: Commit the server data wiring**

```bash
git add apps/user/lib apps/user/app/'(site)'/page.tsx apps/user/app/_components/ServicesSection.tsx apps/user/app/_components/ServiceCards.tsx apps/user/app/'(site)'/order apps/user/__tests__/services-section.test.mjs apps/user/__tests__/order-page.test.mjs
git commit -m "feat: load order products from supabase"
```

---

### Task 4: Render profile-specific options and summaries generically

**Files:**
- Modify: `apps/user/app/(site)/order/OrderOptionSelection.tsx`
- Modify: `apps/user/app/(site)/order/OrderCustomerInfoStep.tsx`
- Modify: `apps/user/app/(site)/order/OrderPaymentResult.tsx`
- Modify: `apps/user/app/(site)/order/page.module.css`
- Modify: `apps/user/__tests__/order-page.test.mjs`

**Interfaces:**
- Consumes: selected `OrderProductConfig`
- Produces: generic selection IDs, label rows, and a server-verifiable `OrderSelectionSummary`

- [ ] **Step 1: Replace fixed page/paper IDs with generic selections**

Use this shape in the browser payload:

```ts
export type OrderSelectedOptionIds = {
  hasPlanning: boolean
  optionIds: Partial<Record<ProductOptionKey, string>>
  productId: string
  quantityId: string | null
  serviceId: DirectOrderServiceId
}

export type OrderSelectionSummary = {
  categoryLabel: string
  ids: OrderSelectedOptionIds
  optionRows: ReadonlyArray<{ label: string; value: string }>
  priceRows: ReadonlyArray<{ label: string; value: number }>
  quantityLabel: string | null
  serviceLabel: string
  totalPrice: number
}
```

Remove `pageLabel`, `paperLabel`, and client-supplied `unitPrice` as authoritative fields.

- [ ] **Step 2: Render variants and option groups from data**

- If a fixed category has multiple valid subtype rows, render one `상품 종류` choice group first.
- On variant change, reset generic option IDs, quantity, and planning to that product's defaults.
- Loop through `optionGroups` in profile order rather than writing page and paper sections separately.
- Use stable, unique heading IDs derived from the option key.
- Preserve keyboard-accessible buttons, `aria-pressed`, focus visibility, desktop grid, and mobile single-column behavior.

- [ ] **Step 3: Make planning and quantity conditional**

- Render the planning service card only when `planningEstimate !== null`.
- Render the quantity table only when `quantityUnit` and quantity rows exist.
- Format quantity with its product unit (`부` or `개`).
- For logo, show no planning or quantity UI and use the single design estimate as total.

- [ ] **Step 4: Build generic summaries**

- Create `optionRows` from the selected option groups.
- For quantity products, show one `디자인 + 인쇄` base row equal to `quantity × unitPrice`, plus optional planning.
- For logo, show one `로고 시안` row equal to `design_print_estimate`.
- Render the same generic rows in the sticky summary, customer-info confirmation, and result component.
- Ensure displayed price rows sum exactly to `totalPrice`.

- [ ] **Step 5: Update focused assertions**

Replace source assertions tied to `pageOptions`, `paperOptions`, and hardcoded quantity tables with behavior/contract assertions for:

- four booklet option groups;
- three standard option groups plus variant choice;
- logo without planning/quantity;
- generic summary rendering;
- reset behavior after category or variant change.

- [ ] **Step 6: Run the user checks**

Run:

```bash
pnpm --filter user test
pnpm --filter user check-types
pnpm --filter user lint
```

Expected: PASS.

- [ ] **Step 7: Commit the conditional user flow**

```bash
git add apps/user/app/'(site)'/order apps/user/app/_content/order.ts apps/user/__tests__/order-page.test.mjs
git commit -m "feat: render product configuration in orders"
```

---

### Task 5: Revalidate product and price inside the payment server action

**Files:**
- Modify: `apps/user/app/(site)/order/payment.ts`
- Modify: `apps/user/__tests__/order-page.test.mjs`
- Modify: `packages/supabase/tests/content-helpers.test.mjs` if the detail-query fake needs another chain method

**Interfaces:**
- Consumes: untrusted `OrderPaymentSubmitPayload`, `getPublishedProduct`, pure configuration parser/calculator
- Produces: failure for stale/tampered selections, validated server total for the future payment handoff

- [ ] **Step 1: Add failing server-action contract tests**

Assert that `payment.ts`:

- creates the public server client;
- reads the selected row by `productId` and `status = published`;
- reconstructs the order config from the fresh row;
- validates the service slug, subtype/product variant, every option ID, quantity ID, and planning availability;
- computes the total on the server;
- rejects a missing/unpublished product, changed quantity, removed option, or mismatched client total;
- does not import `orderProductRegistrations` or trust `summary.ids.unitPrice`.

- [ ] **Step 2: Implement fresh-row repricing**

In `submitOrderPayment`:

1. Validate customer fields and required agreements again on the server.
2. Create the anon public client; fail with `product-unavailable` if env or query is unavailable.
3. Fetch `getPublishedProduct(client, payload.summary.ids.productId)`.
4. Parse it into one `OrderProductConfig` and verify its derived `serviceId` equals the submitted slug.
5. Run the same pure `calculateOrderSelection` helper used by the UI.
6. Compare the recomputed total to the submitted display total, but retain the server total as authoritative for any future payment provider call.
7. Keep the current `payment-not-ready` result after validation; this plan does not add a payment provider.

- [ ] **Step 3: Run tamper and regression tests**

Run:

```bash
pnpm --dir apps/user exec node --experimental-strip-types --test __tests__/order-product-data.test.mjs
pnpm --filter user test
pnpm --filter user check-types
```

Expected: PASS, including stale product, stale option, stale quantity, planning tamper, total tamper, and logo cases.

- [ ] **Step 4: Commit server-side validation**

```bash
git add apps/user/app/'(site)'/order/payment.ts apps/user/__tests__/order-page.test.mjs packages/supabase/tests/content-helpers.test.mjs
git commit -m "fix: verify order prices from published products"
```

---

### Task 6: Verify data readiness, failure modes, and rollout

**Files:**
- Modify only if verification finds a defect in files already owned by Tasks 1–5

- [ ] **Step 1: Apply migrations to a disposable local database**

Run the repository's existing local Supabase workflow, then verify both the 1단계 schema migration and this plan's public grant migration apply from a clean database and on a database containing legacy product rows.

- [ ] **Step 2: Run the production-readiness queries in read-only mode**

```sql
select
  type,
  configuration ->> 'subtype' as subtype,
  count(*) as published_rows
from public.products
where status = 'published'
group by type, configuration ->> 'subtype'
order by type, subtype;
```

Before enabling direct ordering:

- profiles without subtype have no duplicate published rows;
- profiles with subtype have no duplicate `(type, subtype)` rows;
- every directly ordered row has `configuration.version = 1`;
- every required option group is non-empty;
- every non-logo row has at least one valid quantity/price row;
- logo has an explicitly reviewed `design_print_estimate`;
- unknown legacy types are either draft/reclassified or intentionally covered by `기타` consultation.

- [ ] **Step 3: Run all automated checks**

```bash
pnpm --filter @repo/supabase test
pnpm --filter @repo/supabase check-types
pnpm --filter @repo/supabase lint
pnpm --filter user test
pnpm --filter user check-types
pnpm --filter user lint
pnpm --filter user build
git diff --check
```

Expected: every command passes.

- [ ] **Step 4: Manually verify home and order flows**

At desktop and 390px widths:

1. Home and `/order` show the same six fixed direct categories in the same order and three consultation categories.
2. Admin price/option edits appear after refresh without a code change.
3. Unpublishing a variant removes it; unpublishing the final variant turns that category into consultation-only.
4. Booklet, standard, banner quantity unit `개`, and logo no-quantity flows render correctly.
5. Deep links such as `/order?service=banner-display` select only a currently direct-orderable category.
6. Customer summary contains all selected generic options and a total equal to its price rows.
7. Changing the DB price between option selection and submit causes a safe stale-price failure rather than accepting the old total.

- [ ] **Step 5: Manually verify fail-closed scenarios**

1. Start without public Supabase env vars: pages render, no old numeric prices appear, and only consultation is available.
2. Simulate a product-query error: user sees the neutral availability message, not a stack trace.
3. Publish malformed or duplicate test data in the disposable DB: that product/variant cannot enter direct payment.
4. Tamper with product, option, quantity, planning, and total IDs in the browser request: the server action rejects each case.

- [ ] **Step 6: Run the required Figma URL scan**

```bash
rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages
```

Expected: no output and exit code 1 because there are no matches.

- [ ] **Step 7: Review and commit verification fixes, if any**

```bash
git status --short
git diff --check
```

Stage only files listed in this plan. If verification required fixes, commit them separately:

```bash
git commit -m "fix: complete product data integration verification"
```

---

## Rollout Order

1. Deploy [1단계 관리자 및 DB 구조 전환](./2026-08-06-admin-product-db-conversion.md).
2. In admin, reclassify unmatched rows, save canonical configurations, and decide which duplicate/no-subtype rows remain published.
3. Run the readiness queries and manually verify all direct-order prices.
4. Apply the anon column-grant migration from Task 1.
5. Deploy the user application changes.
6. Monitor product-query errors and invalid/stale-price failures before removing any legacy columns.

Rolling back the user app must not roll back or delete product data. Keep the additive `configuration` column and legacy columns until the new user flow has been stable and production data has been audited.

## Explicitly Skipped

- Payment-provider integration: the current `payment-not-ready` behavior remains after secure validation.
- Automatic destructive merging of duplicate products: administrators decide which row/subtype remains published.
- A generic CMS or form-builder framework: six fixed types and seven option keys fit plain maps and pure functions.
- Client-side Supabase fetching or realtime subscriptions: initial server loading and refresh are sufficient for this catalog.
- Dropping `paper_types`, `page_counts`, `order_quantities`, or `unit_prices`: legacy cleanup happens only after this phase is stable.
