# Admin-backed Order Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the public home service cards, `/order` option flow, and checkout amount use the currently published administrator product configuration as their single source of truth.

**Architecture:** Move the administrator's fixed variant/profile metadata into a shared Supabase package module, then validate grouped product JSONB into a plain serializable catalog. Server Components load that catalog once for the home and order pages, while a pure calculator resolves the selected variant, option combination, quantity row, service estimate, and total in both the browser and checkout route. The checkout route fetches the latest published row and rejects stale or tampered selections before creating a payment.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.9/6, Supabase/Postgres JSONB, Node test runner, CSS Modules

**Status:** Completed and verified on 2026-08-13. The live read-only catalog returned six published products and ten order variants; package, admin, and user tests/builds passed.

## Global Constraints

- The six fixed administrator product types and every subtype/option section remain exactly as currently defined in `apps/admin/src/pages/productFormUi.ts`.
- Only `status = 'published'` products are shown as directly orderable.
- `configuration.variants[*].optionValues`, `priceRowsBySelection`, and `serviceEstimatesBySelection` are the commercial source of truth; no static price fallback may be used.
- A quantity row's stored `unitPrice` is the exact price for that quantity row. Seed values such as quantity `100` with price `850000` must not be multiplied by `100` again.
- A service-only variant (`명함`, `로고`) multiplies its service estimate by the selected people/proposal count. Planning estimates are per estimate unit and use the same applicable page/side/people multiplier.
- The browser may display and submit a quote, but the checkout route must fetch the latest published product and recompute the amount. A changed quote returns a conflict instead of silently charging a new amount.
- Existing unrelated dirty-worktree changes belong to the user. Do not reset, stage, commit, or reformat them.
- Do not create a new dependency, state library, API route for reads, or database migration.
- Follow `design.md`; preserve the existing order page layout, typography, focus behavior, responsive breakpoints, and local icon pattern.
- No Figma API asset URL may appear in `apps` or `packages`.

---

### Task 1: Share the administrator product profile contract

**Files:**
- Create: `packages/supabase/src/productConfiguration.ts`
- Modify: `packages/supabase/src/index.ts`
- Modify: `packages/supabase/package.json`
- Modify: `apps/admin/src/pages/productFormUi.ts`
- Create: `packages/supabase/tests/product-configuration.test.mjs`

**Interfaces:**
- Consumes: `ProductType` from `@repo/supabase/categories`
- Produces: `productSubtypeOptions`, `ProductVariant`, `ProductOptionSectionKey`, `ProductUiProfile`, `getProductVariants()`, `getProductUiProfile()`, `getProductPriceOptionKeys()`, `getProductServiceOptionKeys()`, `getProductSelectionKey()`

- [ ] **Step 1: Write a failing shared-profile test**

```js
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getProductPriceOptionKeys,
  getProductServiceOptionKeys,
  getProductUiProfile,
  getProductVariants,
} from '../src/productConfiguration.ts'

test('shared profiles preserve administrator variants and price axes', () => {
  assert.deepEqual(getProductVariants('포스터 · 전단지'), ['포스터', '전단지'])
  assert.deepEqual(getProductPriceOptionKeys('포스터 · 전단지', '전단지'), [
    'size', 'paper', 'thickness', 'side',
  ])
  assert.deepEqual(getProductServiceOptionKeys('명함 · 봉투', '명함'), [
    'material', 'thickness',
  ])
  assert.deepEqual(
    getProductUiProfile('로고').sections.map((section) => section.key),
    ['logoType', 'proposalCount'],
  )
})
```

- [ ] **Step 2: Run the package test and verify it fails**

Run: `pnpm --filter @repo/supabase test`

Expected: FAIL because `productConfiguration.ts` does not exist.

- [ ] **Step 3: Move the immutable profile metadata into the package**

Create the shared module with the exact existing subtype lists, option-key union, UI section/profile types, ten variant profiles, price-axis map, and service-axis map. Export explicit helpers accepting `(productType, productSubtype = '')`; do not read JSON object key order when building selection keys.

```ts
export function getProductSelectionKey(
  optionKeys: readonly ProductOptionSectionKey[],
  selectedOptionIndexes: Partial<Record<ProductOptionSectionKey, number>>,
) {
  return optionKeys
    .map((optionKey) => selectedOptionIndexes[optionKey] ?? 0)
    .join(':')
}
```

- [ ] **Step 4: Make the admin form re-export the shared contract**

Replace the duplicated profile declarations in `productFormUi.ts` with imports/re-exports from `@repo/supabase/product-configuration`. Keep draft creation, Cartesian key enumeration, removal/reindexing, headings, and existing public function names local so current administrator call sites remain unchanged.

- [ ] **Step 5: Verify the shared and administrator contracts**

Run:

```bash
pnpm --filter @repo/supabase test
pnpm --filter admin test
pnpm --filter @repo/supabase check-types
pnpm --filter admin build
```

Expected: PASS.

---

### Task 2: Parse grouped JSONB and calculate exact selections

**Files:**
- Create: `packages/supabase/src/productCatalog.ts`
- Modify: `packages/supabase/src/products.ts`
- Modify: `packages/supabase/src/index.ts`
- Modify: `packages/supabase/package.json`
- Create: `packages/supabase/tests/product-catalog.test.mjs`
- Modify: `packages/supabase/tests/content-helpers.test.mjs`

**Interfaces:**
- Consumes: `PublicProduct.configuration` and the Task 1 profile/key helpers
- Produces: `OrderProductCatalogItem`, `OrderProductVariant`, `createOrderProductCatalog()`, `createOrderProductCatalogItem()`, `createDefaultProductSelection()`, `getProductPriceRows()`, `calculateProductSelection()`, `getPublishedProduct()`

- [ ] **Step 1: Write failing grouped-catalog tests**

Use grouped fixtures for a brochure, business card, and logo. Assert that:

```js
assert.equal(
  calculateProductSelection(brochure, {
    hasPlanning: false,
    optionValues: {
      pageCount: '8', paper: '일반지', thickness: '보통', coverCoating: '무광',
    },
    quantity: 100,
  }).totalPrice,
  850000,
)

assert.equal(
  calculateProductSelection(businessCard, {
    hasPlanning: true,
    optionValues: {
      size: '90x50mm', baseQuantity: '일반지 500', material: '고급지',
      thickness: '두꺼운', people: '3',
    },
    quantity: null,
  }).totalPrice,
  240000,
)

assert.equal(
  calculateProductSelection(logo, {
    hasPlanning: false,
    optionValues: { logoType: '워드마크', proposalCount: '3' },
    quantity: null,
  }).totalPrice,
  150000,
)
```

Also reject missing option values, unknown values, duplicate quantities, unknown combination keys, non-finite prices, and planning on logo. A missing administrator price combination remains unavailable without invalidating other priced combinations.

- [ ] **Step 2: Run focused package tests and verify failure**

Run: `pnpm --filter @repo/supabase test`

Expected: FAIL because the parser/calculator exports do not exist.

- [ ] **Step 3: Implement strict JSONB parsing**

Require the grouped root `variants` object and every variant named by `getProductVariants(product_type)`. For each variant, copy only non-empty unique option strings, safe integer quantity/price rows, and safe integer service estimates. Derive section labels and units from the shared profile, never from JSON key order. Return `null` for a malformed published product so the user flow fails closed.

- [ ] **Step 4: Implement selection calculation**

Resolve option values back to their current indexes, derive price/service keys with shared axis helpers, then calculate:

```ts
const estimatedDesignAmount = estimate.designPrintEstimate * estimateMultiplier
const baseAmount = quantityRow?.unitPrice ?? estimatedDesignAmount
const designPrintAmount = Math.min(estimatedDesignAmount, baseAmount)
const printAmount = baseAmount - designPrintAmount
const planningAmount = selection.hasPlanning
  ? estimate.planningEstimate * estimateMultiplier
  : 0
const totalPrice = baseAmount + planningAmount
```

Use page count for brochure, side count for flyer, people for business cards, proposal count for logo, and `1` for other variants. Return plain option/price rows for the UI and checkout snapshot.

- [ ] **Step 5: Add a published single-row query**

Implement `getPublishedProduct(client, id)` with the same explicit public columns as the list query, `.eq('status', 'published')`, `.eq('id', id)`, and `.maybeSingle()`.

- [ ] **Step 6: Verify parser, query, types, and lint**

Run:

```bash
pnpm --filter @repo/supabase test
pnpm --filter @repo/supabase check-types
pnpm --filter @repo/supabase lint
```

Expected: PASS.

---

### Task 3: Load one catalog for the home and order pages

**Files:**
- Modify: `apps/user/lib/publicContent.ts`
- Modify: `apps/user/app/_content/services.ts`
- Modify: `apps/user/app/_components/ServicesSection.tsx`
- Modify: `apps/user/app/_components/ServiceCards.tsx`
- Modify: `apps/user/app/(site)/page.tsx`
- Modify: `apps/user/app/(site)/order/page.tsx`
- Create: `apps/user/app/(site)/order/OrderPageClient.tsx`
- Modify: `apps/user/app/(site)/order/OrderFlowSection.tsx`
- Modify: `apps/user/__tests__/public-content-loader.test.mjs`
- Modify: `apps/user/__tests__/services-section.test.mjs`
- Modify: `apps/user/__tests__/order-page.test.mjs`

**Interfaces:**
- Consumes: `getPublishedOrderProducts(): Promise<readonly OrderProductCatalogItem[]>`
- Produces: `createServiceItems(products): readonly ServiceItem[]`; serializable `products` and `services` props for `OrderPageClient`

- [ ] **Step 1: Add failing server-boundary assertions**

Assert that the home and order server pages call `getPublishedOrderProducts()`, `order/page.tsx` contains no `"use client"`, and `OrderPageClient.tsx` owns the current effects/state. Assert that `ServicesSection` and `ServiceCards` receive `services` rather than importing a global array.

- [ ] **Step 2: Add the cached public product loader**

```ts
async function loadPublishedOrderProducts() {
  await connection()

  try {
    const client = createPublicUserSupabaseClient()
    if (!client) return []
    return createOrderProductCatalog(await listPublishedProducts(client))
  } catch (error) {
    console.error('Failed to load published products.', error)
    return []
  }
}

export const getPublishedOrderProducts = cache(loadPublishedOrderProducts)
```

- [ ] **Step 3: Derive service cards without static commercial values**

Keep only icons and descriptions in `services.ts`. Build the direct-order cards in the published administrator `sort_order`; use the same quantity-first lowest-price rule as the admin list for each `원~` value. A missing/invalid/unpublished category has no numeric fallback and is omitted from direct order while the consultation card remains available.

- [ ] **Step 4: Split the order Server/Client boundary**

Make `order/page.tsx` an async Server Component that loads products and renders `<OrderPageClient products={products} services={services} />`. Move all existing browser state, query-string handling, payment request IDs, and body dataset effects into the new client component.

- [ ] **Step 5: Thread catalog props through the UI**

Pass `services` through `OrderPageClient → OrderFlowSection → ServiceCards`, and pass the selected `OrderProductCatalogItem` into `OrderOptionSelection`. Resolve `?service=` only against currently direct-orderable services.

- [ ] **Step 6: Verify the loader and server boundaries**

Run:

```bash
pnpm --filter user test
pnpm --filter user check-types
```

Expected: PASS.

---

### Task 4: Render every administrator option and dynamic price

**Files:**
- Replace: `apps/user/app/_content/order.ts`
- Modify: `apps/user/app/(site)/order/OrderOptionSelection.tsx`
- Modify: `apps/user/app/(site)/order/OrderCustomerInfoStep.tsx`
- Modify: `apps/user/app/(site)/order/OrderPaymentResult.tsx`
- Modify: `apps/user/app/(site)/order/payment.ts`
- Modify: `apps/user/app/(site)/order/page.module.css`
- Modify: `apps/user/__tests__/order-page.test.mjs`
- Modify: `apps/user/__tests__/site-payment.test.mjs`

**Interfaces:**
- Consumes: `OrderProductCatalogItem`, `calculateProductSelection()`
- Produces: generic `OrderSelectionSummary` and checkout selection

- [ ] **Step 1: Replace fixed page/paper identifiers**

```ts
export type OrderSelectedOptionIds = {
  hasPlanning: boolean
  optionValues: Partial<Record<ProductOptionSectionKey, string>>
  productId: string
  quantity: number | null
  quotedTotal: number
  serviceId: ProductCategoryId
  variant: ProductVariant
}

export type OrderSelectionSummary = {
  categoryLabel: string
  ids: OrderSelectedOptionIds
  optionRows: ReadonlyArray<{ label: string; value: string }>
  priceRows: ReadonlyArray<{ label: string; value: number }>
  serviceLabel: string
  totalPrice: number
}
```

- [ ] **Step 2: Render variant and option groups from the shared profile**

Use one state object initialized by `createDefaultProductSelection()`. When a subtype changes, reset all options and quantity to that variant's first valid combination. When an option changes, preserve the selected quantity only if it exists in the new combination; otherwise select the first current row.

- [ ] **Step 3: Make service cards and totals reactive**

Display the current `serviceEstimatesBySelection` rate in section II. Loop over every admin option section in order, render the quantity section only for profiles that have it, and render planning only when the profile enables it. Use `calculateProductSelection()` for the quantity-row totals, sticky summary, mobile payment bar, and submitted quote.

- [ ] **Step 4: Make confirmation/result summaries generic**

Replace the fixed page/paper rows with `summary.optionRows.map(...)` in the customer step and payment-result fallback. Keep category, service, and total rows unchanged.

- [ ] **Step 5: Submit only verifiable selection data**

`payment.ts` sends `productId`, `serviceId`, `variant`, `optionValues`, `quantity`, `hasPlanning`, and `quotedTotal`; it sends no client unit-price matrix or provider-owned amount.

- [ ] **Step 6: Verify the user flow types and tests**

Run:

```bash
pnpm --filter user test
pnpm --filter user check-types
pnpm --filter user lint
```

Expected: PASS.

---

### Task 5: Reprice checkout from the latest published product

**Files:**
- Modify: `apps/user/app/api/orders/checkout/route.ts`
- Modify: `apps/user/__tests__/site-payment.test.mjs`
- Modify: `apps/user/__tests__/order-page.test.mjs`

**Interfaces:**
- Consumes: untrusted generic selection, `getPublishedProduct()`, `createOrderProductCatalogItem()`, `calculateProductSelection()`
- Produces: server-owned checkout amount and generic item snapshot

- [ ] **Step 1: Add failing anti-tamper source assertions**

Assert that the route calls `getPublishedProduct`, reconstructs the selected variant, calls `calculateProductSelection`, compares the calculated total to `quotedTotal`, and never reads a browser `amount`, `totalPrice`, or `unitPrice` as authoritative.

- [ ] **Step 2: Parse the generic selection defensively**

Accept only known option keys with non-empty bounded strings, a known service slug, UUID product ID, variant string, boolean planning flag, positive integer-or-null quantity, and non-negative safe-integer quoted total.

- [ ] **Step 3: Fetch and calculate before payment creation**

Reuse one admin server client, fetch the row by product ID with published status, validate its derived category slug and variant, calculate the current selection, and return HTTP `409` with `상품 옵션 또는 가격이 변경되었습니다. 옵션을 다시 선택해주세요.` when the recomputed total differs from the quote.

- [ ] **Step 4: Store a generic server-owned snapshot**

Store category/product/variant IDs, generic option rows, selected quantity, planning inclusion, calculated price rows, and total. Build `orderName` from the server-derived category/variant/quantity labels and retain the existing NICEPAY configuration and idempotent checkout flow.

- [ ] **Step 5: Run complete verification**

Run:

```bash
pnpm --filter @repo/supabase test
pnpm --filter @repo/supabase check-types
pnpm --filter @repo/supabase lint
pnpm --filter admin test
pnpm --filter admin build
pnpm --filter user test
pnpm --filter user check-types
pnpm --filter user lint
pnpm --filter user build
git diff --check
rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages
```

Expected: all build/test/type/lint checks pass; `rg` prints no matches and exits `1`.

- [ ] **Step 6: Verify live read-only catalog behavior**

Using the configured public Supabase environment, confirm six published grouped products parse, every variant has a default calculation, category cards match the admin lowest prices, changing option values changes the selected row/rate, and no database writes occur.

---

## Self-review

- Spec coverage: home category prices, `/order` category prices, every admin option, reactive combination pricing, and checkout repricing are each assigned to Tasks 2–5.
- Placeholder scan: the plan contains no deferred implementation markers or unspecified error-handling steps.
- Type consistency: all UI and checkout layers use `OrderSelectedOptionIds`; product parsing/calculation stays in `@repo/supabase`; only JSON-serializable data crosses the Server/Client boundary.
- Scope: blog, portfolio, complaint, LinkPay UI, migrations, and unrelated user changes are excluded.
