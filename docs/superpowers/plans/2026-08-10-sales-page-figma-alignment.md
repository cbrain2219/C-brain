# SalesPage Figma Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Match the Figma sales summary, product trend chart, and one-row-per-payment transaction table with verified live payment data and a deterministic Korean-business-day settlement estimate, while leaving the header and footer unchanged.

**Architecture:** Keep Supabase as the verified payment/refund ledger and derive a read-only sales view model in `@repo/supabase`. A fixed settlement policy calculates card fee and estimated settlement from each payment's current refundable balance, and a Korean holiday calendar supplies the five-business-day date. The admin page renders current-month summary metrics, today’s scheduled settlement batch, selected-range product series, and one consolidated row per payment; GA visitor count remains nullable until GA is connected.

**Tech Stack:** React 19, TypeScript, Vite, Supabase JS, Node test runner, CSS, `date-holidays@3.34.1`.

## Global Constraints

- Do not modify `AdminHeader`, `AdminFooter`, or authenticated-shell composition.
- Follow `design.md`: use Pretendard GOV Variable tokens, SVG icons through `AdminIcon`, parent `gap` for component spacing, and no custom focus styles.
- Use the Figma empty node `227:4223` and populated node `227:3667` as the visual/content reference, excluding the 96px mock browser chrome.
- Preserve KST boundaries and admin authorization.
- Count summary cards over the current KST calendar month, independent of the selected chart/table date range.
- Sum the monthly payment amount after refunds: full refunds contribute 0 and partial refunds contribute only their remaining balance; keep the payment count as one per original verified payment.
- Calculate `cardFee = Math.round(currentAmount * 0.029 * 1.1)` per payment and `settlementAmount = currentAmount - cardFee`.
- Calculate the expected settlement date as five Korean business days after the payment date, excluding the payment date, Saturdays, Sundays, and Korean public/substitute holidays.
- Treat settlement status as a rule-based estimate, not provider-confirmed bank reconciliation: dates before today are `settled`, today/future dates are `scheduled`.
- The user explicitly approved current-balance recomputation after refunds. Therefore `partial-refund` supersedes scheduled/settled display status and its `정산금` is the current remaining-balance projection even when the expected settlement date has passed; this is not a historical payout-reconciliation value.
- Show today’s scheduled settlement amount only: sum settlement amounts whose expected settlement date equals today.
- Keep one row per payment. Full refunds render `refund-complete`, fee/settlement `0`, receipt `-`; partial refunds render `partial-refund`, recompute fee/settlement from the remaining balance, retain the original receipt, and keep refund action when balance remains.
- Use runtime-validated `orders.item_snapshot.service` for site product identity and runtime-validated, trimmed `orders.item_snapshot.category` for LinkPay product identity. Malformed JSON must fall back to the order name instead of failing the dashboard.
- GA is intentionally not connected in this task. Represent visitor count as `null` and render `—` with an explanatory accessible label, never `0명`.
- Preserve the user’s existing unrelated edit in `apps/admin/src/components/admin-table/AdminDataTableSection.css`.
- Do not keep Figma MCP asset URLs in source. Run the required final `rg` check even though this implementation should add no assets.
- Do not create git commits during this inline execution unless the user separately requests them.

---

### Task 1: Add deterministic settlement and consolidated payment read models

**Files:**
- Modify: `packages/supabase/package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `packages/supabase/src/sales.ts`
- Modify: `packages/supabase/tests/sales.test.mjs`

**Interfaces:**
- Consumes: verified `payments` rows joined to `orders`, `balance_amount`, `can_part_cancel`, and `orders.item_snapshot`.
- Produces: `calculateEstimatedSettlement(currentAmount: number): { cardFee: number; settlementAmount: number }`.
- Produces: `getExpectedSettlementDate(paidAt: string): Promise<string>` returning an ISO KST date.
- Produces: `SalesTransaction`, `SalesSummary`, and `SalesDashboardData` contracts below.

```ts
export type SalesTransactionStatus =
  | 'partial-refund'
  | 'refund-complete'
  | 'scheduled'
  | 'settled'

export type SalesSummary = {
  monthlyPaymentAmount: number
  monthlyPaymentCount: number
  monthlyVisitorCount: number | null
  scheduledSettlementAmount: number
  settlementDate: string
}

export type SalesTransaction = {
  cardFee: number
  canPartCancel: boolean | null
  channel: OrderChannel
  customerLabel: string
  id: string
  occurredAt: string
  orderName: string
  paymentId: string
  productId: string
  productLabel: string
  receiptUrl: string | null
  refundableAmount: number
  settlementAmount: number
  settlementDate: string
  status: SalesTransactionStatus
  transactionAmount: number
}

export type SalesDashboardData = {
  summary: SalesSummary
  transactions: readonly SalesTransaction[]
}

export type GetAdminSalesDashboardInput = {
  channel: SalesChannel
  from: string // inclusive instant at the selected start date's KST midnight
  to: string // exclusive instant after the selected end date's KST midnight
  today: string // YYYY-MM-DD in Asia/Seoul, captured once by SalesPage
}
```

- [x] **Step 1: Add failing settlement-policy tests**

Add tests that assert:

```js
assert.deepEqual(calculateEstimatedSettlement(10_000), {
  cardFee: 319,
  settlementAmount: 9_681,
})
assert.deepEqual(calculateEstimatedSettlement(7_000), {
  cardFee: 223,
  settlementAmount: 6_777,
})
assert.deepEqual(calculateEstimatedSettlement(0), {
  cardFee: 0,
  settlementAmount: 0,
})
assert.equal(
  await getExpectedSettlementDate('2026-08-10T03:00:00.000Z'),
  '2026-08-18',
)
```

The date assertion covers 광복절 대체공휴일 on 2026-08-17.

- [x] **Step 2: Run the package test and confirm the new exports fail**

Run: `pnpm --filter @repo/supabase test`

Expected: FAIL because `calculateEstimatedSettlement` and `getExpectedSettlementDate` do not exist.

- [x] **Step 3: Add the Korean holiday dependency and settlement helpers**

Pin `date-holidays` to `3.34.1` and load it through `await import('date-holidays')` inside a cached calendar factory so the worldwide holiday dataset is emitted as a sales-only async chunk instead of the shared admin entry chunk. Clear a rejected loader promise so the dashboard's retry action can recover from a transient chunk failure. Initialize `new Holidays('KR', { timezone: 'Asia/Seoul', types: ['public', 'bank'] })`. Implement KST ISO-date helpers without using the host timezone. `getExpectedSettlementDate` must advance one calendar day at a time, count only Monday–Friday dates for which `holidays.isHoliday(kstNoonDate)` returns false, and stop after five counted days. Use KST noon when passing a date into the holiday library so UTC conversion cannot move it to an adjacent Korean date. The package rule set covers recurring Korean holidays and explicit substitute-day rules through 2050; if a calculation exceeds the supported lunar/substitute rule horizon, throw an explicit settlement-calendar error rather than silently treating an unknown date as a business day.

Use integer won arithmetic:

```ts
const CARD_FEE_RATE = 0.029
const CARD_FEE_VAT_MULTIPLIER = 1.1
const SETTLEMENT_BUSINESS_DAYS = 5

export function calculateEstimatedSettlement(currentAmount: number) {
  const cardFee = Math.round(
    currentAmount * CARD_FEE_RATE * CARD_FEE_VAT_MULTIPLIER,
  )
  return { cardFee, settlementAmount: currentAmount - cardFee }
}
```

- [x] **Step 4: Replace event rows with consolidated payment transactions**

Change the Supabase select to fetch `id, amount, balance_amount, can_part_cancel, status, paid_at, created_at, receipt_url` plus:

```text
orders!inner(channel, customer_label, item_snapshot, order_name)
```

Do not issue a separate refund-event query. Add `normalizeProduct(channel, snapshot: Json, paymentId, orderName)` with record/string guards before reading nested JSON. Normalize products as follows:

```ts
site     -> trimmed item_snapshot.service.id / trimmed item_snapshot.service.label
linkpay  -> `linkpay:${category}` / category, where category is one trimmed string
fallback -> `unknown:${payment id}` / order_name
```

For every verified payment (`paid`, `partial_cancelled`, `cancelled`):

```ts
isFullRefund = status === 'cancelled' or balance_amount === 0
currentAmount = isFullRefund ? 0 : (balance_amount ?? amount)
refund-complete when isFullRefund
partial-refund when 0 < currentAmount < amount or status === 'partial_cancelled'
settled when expectedSettlementDate < today
scheduled otherwise
```

Set `receiptUrl` to `null` only for full refunds. Keep the original transaction amount in `transactionAmount`; calculate fee and settlement from `currentAmount`.

Use `paymentOccurredAt = paid_at ?? created_at` consistently for `occurredAt` and settlement-date calculation. A `partial_cancelled` payment without a finite `balance_amount` is a ledger-integrity error and must fail the dashboard load; never substitute the original amount for a missing partial-refund balance.

- [x] **Step 5: Query and reconcile the three date windows**

Within one admin-authorized dashboard call, validate `today` as an ISO KST date and define:

1. Selected `from`/`to` payments for chart/table transactions.
2. Current KST month payments for `monthlyPaymentAmount` and `monthlyPaymentCount`.
3. Candidate payment dates whose five-business-day settlement date can equal `today`. If `today` is not a Korean business day, return `0` without this query. Otherwise find `b1`, the first of the five business days ending on `today`, then find `b0`, the Korean business day immediately preceding `b1`. Query `[KST midnight(b0), KST midnight(b1))`; this includes `b0` and any following weekend/holiday payment dates. Calculate every returned row's exact settlement date, retain only matches to `today`, and sum their current settlement amounts.

Apply the same selected channel to every window. Merge overlapping/adjacent windows before reading, then derive selected/month/candidate rows from the same returned payment objects so overlapping cards, chart, and table cannot disagree during a concurrent refund. Every payment fetch must use stable `paid_at ASC, id ASC` seek pagination with a strict `(paid_at, id)` cursor until a short page is returned; do not use mutable offset pagination. The selected range is `[KST midnight(from), KST midnight(selected end + 1 day))`; the monthly window is `[KST midnight(month start), KST midnight(next month start))`. `monthlyPaymentAmount` is the sum of each verified payment's current remaining amount in that current-month window: a full refund contributes `0`, and a partial refund contributes only `balance_amount`. `monthlyPaymentCount` still counts those original payment rows. Set `monthlyVisitorCount: null` and `settlementDate: today`.

- [x] **Step 6: Expand tests for status, product normalization, monthly summary, and today’s batch**

Cover site snapshot identity, malformed/blank JSON fallback, LinkPay category identity, full/partial refund projection, missing partial-refund balance failure, nullable `canPartCancel`, current-month remaining-amount aggregation for paid/partially-refunded/fully-refunded rows, seek pagination beyond one configured page with an insert before the cursor, and exclusion of rows whose expected settlement date is not today. Add date tests for a KST date that differs from UTC, an end-of-year boundary, a weekend payment before the five-business-day sequence, and a non-business `today` that produces a zero batch without a candidate window.

- [x] **Step 7: Run package verification**

Run:

```bash
pnpm --filter @repo/supabase test
pnpm --filter @repo/supabase check-types
pnpm --filter @repo/supabase lint
```

Expected: all commands exit 0.

---

### Task 2: Build product-aware chart series and date labels

**Files:**
- Modify: `apps/admin/src/pages/salesData.ts`
- Modify: `apps/admin/tests/salesData.test.mjs`

**Interfaces:**
- Consumes: `readonly SalesTransaction[]` and selected `SalesFilters`.
- Produces: an always-present `all` series and one series per normalized product.
- Produces: `formatSettlementLabel(isoDate: string): string`, for example `26. 08. 10. (월) 정산`.

```ts
export type SalesTrendSeries = {
  color: 'brand' | 'info'
  id: string
  label: string
  points: readonly SalesTrendPoint[]
  productId: string | null
}
```

- [x] **Step 1: Replace payment/refund-series tests with product-series tests**

Create a fixture containing two brochure payments and one LinkPay category payment across three KST dates. Assert the output order is `all` first, then products sorted by total descending and label ascending. Assert `all` sums all original transaction amounts while each product series contains only its payments.

- [x] **Step 2: Verify the old series builder fails the product assertions**

Run: `pnpm --filter admin test`

Expected: FAIL because the current builder emits `payments` and `refunds`.

- [x] **Step 3: Implement product-aware bucket aggregation**

Retain the existing maximum of 12 evenly distributed buckets and common y-axis maximum. Use original transaction amounts as gross sales. For a one-day bucket use `M월 D일 판매 금액`; for a multi-day bucket use `M월 D일~M월 D일 판매 금액`. Avoid labeling a multi-day sum as a single date.

- [x] **Step 4: Keep formatting and amount-validation tests intact**

Preserve `formatSalesNumber`, `formatSalesDateLabel`, `getChartPoints`, and `getRefundAmountError` behavior. Add a KST weekday test for `formatSettlementLabel('2026-08-10') === '26. 08. 10. (월) 정산'`. The exact Figma table-header assertion belongs to Task 4 after the table contract changes.

- [x] **Step 5: Run admin unit tests**

Run: `pnpm --filter admin test`

Expected: all tests exit 0.

---

### Task 3: Align summary cards and product trend controls

**Files:**
- Modify: `apps/admin/src/pages/SalesPage.tsx`
- Modify: `apps/admin/src/components/admin-sales/SalesSummaryCards.tsx`
- Modify: `apps/admin/src/components/admin-sales/SalesTrendChart.tsx`
- Modify: `apps/admin/src/pages/SalesPage.css`

**Interfaces:**
- `SalesPage` supplies `today` to the dashboard query and passes `transactions` to the chart/table.
- `SalesSummaryCards` renders nullable visitors without inventing data.
- `SalesTrendChart` keeps channel filtering and independently manages selected product series.

- [x] **Step 1: Update the empty dashboard and request contract**

Use one KST `today` value per render/load cycle and include it in `GetAdminSalesDashboardInput`. Replace host-local `Date#setDate` arithmetic in the default range with ISO/KST date-only arithmetic so a non-KST browser cannot shift the range. The empty summary must be:

```ts
{
  monthlyPaymentAmount: 0,
  monthlyPaymentCount: 0,
  monthlyVisitorCount: null,
  scheduledSettlementAmount: 0,
  settlementDate: today,
}
```

- [x] **Step 2: Render the exact four summary meanings**

Render:

```text
YY. MM. DD. (요일) 정산 / 예정 정산 금액
이번 달 결제 금액
이번 달 결제 건 수
이번 달 방문자 수
```

The visitor value is `—`; give it `aria-label="방문자 집계 연동 전"` and omit the `명` unit until a number exists.

- [x] **Step 3: Replace refund controls with product controls in the chart**

Keep the `전체/사이트/LinkPay` channel select in the teal chip. Make `all` always visible, default to the highest-total available product, allow product chips to be added/removed without duplicates, and reset unavailable selections after a reload. Use the placeholder `상품을 선택해주세요.`.

The empty state retains 19 grid lines, y-axis, labels `1` through `12`, and `조회할 데이터가 없습니다.` without points or tooltip.

- [x] **Step 4: Apply scoped Figma CSS corrections**

Keep the existing geometry. Add the chart selector’s 1px `#f1f5f9` inside border, use `#f1f5f9` for sales-chart grid lines, and add the primary card’s subtle 1px white/10% stroke. Follow `design.md` typography tokens rather than copying Figma’s mixed font families.

- [x] **Step 5: Run admin unit/lint checks**

Run:

```bash
pnpm --filter admin test
pnpm --filter admin lint
```

Expected: both commands exit 0. Type-check/build verification is intentionally deferred until Task 4 migrates the table and refund-dialog contracts from `SalesEvent` to `SalesTransaction`.

---

### Task 4: Align the consolidated transaction table and refund behavior

**Files:**
- Modify: `apps/admin/src/components/admin-sales/SalesTransactionsTable.tsx`
- Modify: `apps/admin/src/components/admin-sales/RefundDialog.tsx`
- Modify: `apps/admin/src/pages/SalesPage.tsx`
- Modify: `apps/admin/tests/salesData.test.mjs`

**Interfaces:**
- Consumes: `SalesTransaction` rows from Task 1.
- Emits: the existing refund request `{ amount: number; reason: string }` for the selected payment ID.

- [x] **Step 1: Replace the header contract**

Use exactly:

```ts
const headers = [
  '상태',
  '상품명',
  '거래일자',
  '거래금액',
  '카드수수료',
  '정산금',
  '거래영수증',
  '환불',
] as const
```

- [x] **Step 2: Render one payment per row**

Display product as `[customerLabel] productLabel`, the original positive payment amount as 거래금액, and the projected fee/settlement amounts. Map statuses to:

```text
refund-complete -> 환불완료 / error
partial-refund  -> 부분환불 / muted
settled         -> 정산완료 / brand
scheduled       -> 정산예정 / muted
```

Full refunds render `-` for receipt and refund. Other rows link the original NICEPAY receipt when present and show the refund action only when `refundableAmount > 0`.

- [x] **Step 3: Enforce provider partial-refund capability in the dialog**

When `canPartCancel === false`, require the entered amount to equal `refundableAmount` and explain that only full remaining-balance cancellation is supported. Preserve `null` as unknown capability and keep the existing server-side validation as the authority.

- [x] **Step 4: Update interaction and source-contract tests**

Assert the eight headers, one-row-per-payment map, full-refund receipt suppression, partial-refund action, full-only validation message, and unknown-capability behavior.

- [x] **Step 5: Run admin and package regression checks**

Run:

```bash
pnpm --filter @repo/supabase test
pnpm --filter admin test
pnpm --filter admin build
```

Expected: all commands exit 0.

---

### Task 5: Align refund dialogs and selection-order chart colors

**Files:**
- Modify: `apps/admin/src/components/admin-sales/RefundDialog.tsx`
- Modify: `apps/admin/src/components/admin-sales/SalesTrendChart.tsx`
- Modify: `apps/admin/src/pages/salesData.ts`
- Modify: `apps/admin/src/pages/SalesPage.css`
- Modify: `apps/admin/tests/salesData.test.mjs`

- [x] **Step 1: Match the two refund-dialog Figma states**

Use node `227:4179` for the `600×344` confirmation dialog and node `227:4171` for the `609×207` completion dialog. Keep 24px radii, 32px content insets, `#f1f5f9` scoped borders, 52px controls, 20px control-label line height, and the exact NICEPAY completion message. Remove the visible refund-reason field and send a stable administrator reason through the existing API contract.

- [x] **Step 2: Make refund amount entry financially safe**

Accept only digits and display-only thousands separators. Reject decimal, exponent, signed, unsafe-integer, and over-limit input without converting it into a different amount. Limit the input to the current `refundableAmount`, show both original and remaining amounts for partially refunded payments, explain provider full-only cancellation when applicable, and retain the server/ledger checks as the final authority. An invalid edit must remain a blocking state so a previously valid amount cannot be submitted accidentally.

- [x] **Step 3: Apply selection-order rainbow colors**

Use node `227:3888` for the 32px chip geometry, then apply the user’s explicit order override: red, orange, yellow, green, blue, indigo, violet. Use one color for each selected product’s chip, line, points, and tooltip; reindex after removal and cycle only after all seven colors are used. Preserve an explicitly empty selection across data reloads, reset unavailable non-empty selections to the current first product, and allow long chip lists to scroll horizontally without covering the product selector.

- [x] **Step 4: Add focused regression coverage and browser QA**

Cover rejected malformed/over-limit amount formats, current-balance wiring, invalid-state submit blocking, selection order/reconciliation, all seven CSS palette declarations, chip/line/point/tooltip color synchronization, exact dialog copy, and both dialog dimensions. Verify the populated page in the browser without executing a real refund.

---

### Task 6: Verify both Figma states and repository safety

**Files:**
- Verify only: `apps/admin/src/pages/SalesPage.tsx`
- Verify only: `apps/admin/src/pages/SalesPage.css`
- Verify only: `apps/admin/src/components/admin-sales/*`
- Verify only: `packages/supabase/src/sales.ts`

- [x] **Step 1: Run the complete affected checks**

Run:

```bash
pnpm --filter @repo/supabase test
pnpm --filter @repo/supabase check-types
pnpm --filter @repo/supabase lint
pnpm --filter admin test
pnpm --filter admin lint
pnpm --filter admin build
```

- [x] **Step 1a: Verify holiday code splitting and bundle budget**

Inspect `apps/admin/dist/assets` after the production build. The shared admin entry chunk must not contain `holidays.json` or `date-holidays`; the holiday dataset must be an async chunk loaded only when the sales dashboard calculation runs. Record raw and gzip sizes, with an acceptance ceiling of 2 MB raw and 500 KB gzip for the holiday async chunk. If the ceiling is exceeded, stop and replace the dependency with a Korea-only generated calendar payload before visual QA.

- [x] **Step 2: Verify the populated state at 1440px**

Confirm content inset 40px, card sizes 325×196, chart card 1360×560, product chip/selector behavior, four summary meanings, exact table headers, consolidated payment rows, and refund dialog behavior.

- [x] **Step 3: Verify the empty state at 1440px**

Confirm zero financial metrics, visitor `—`, today’s settlement badge, 584px empty chart card, labels 1–12, no paths/points/tooltip, and table empty message.

- [x] **Step 4: Verify header/footer and unrelated work were untouched**

Run `git diff -- apps/admin/src/components/AdminHeader.tsx apps/admin/src/components/AdminFooter.tsx apps/admin/src/App.tsx` and confirm no output. Confirm `apps/admin/src/components/admin-table/AdminDataTableSection.css` remains unmodified by this task.

- [x] **Step 5: Run the required Figma asset URL scan**

Run:

```bash
rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages
```

Expected: no matches.

- [x] **Step 6: Review the final diff for scope and financial-label accuracy**

Confirm no provider-confirmed wording was introduced, no actual GA count was fabricated, and every fee/settlement figure follows the approved 2.9% plus VAT rounding policy.
