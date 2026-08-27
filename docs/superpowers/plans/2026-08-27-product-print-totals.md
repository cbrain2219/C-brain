# Product Print Totals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let administrators enter decimal print unit prices and exact print totals, then use the entered print total unchanged in the public order price.

**Architecture:** Extend each quantity row in the existing `products.configuration` JSONB from `{ quantity, unitPrice }` to `{ quantity, unitPrice, printAmount }`. Admin inputs serialize decimal `unitPrice` and integer-won `printAmount`; the shared catalog reads the new value and uses it directly instead of recomputing `quantity × unitPrice`. Existing rows remain readable through a multiplication fallback until they are saved with the new field.

**Tech Stack:** TypeScript, React, Next.js, Vite, Node.js test runner, Supabase JSONB.

**Spec:** User request and `/Users/sangkun/Downloads/인쇄단가표 (1).xlsx`

## Global Constraints

- Preserve unrelated dirty-worktree changes, especially the existing user order-page edits.
- Follow `design.md`: Pretendard GOV typography, parent `gap` spacing, no custom focus treatment, and shared SVG icons.
- Store the exact print total in the existing JSONB configuration; do not add a database column.
- Quantity and print total are whole non-negative won values; unit price may be a non-negative decimal.
- Public calculations and display must use the administrator-entered `printAmount` unchanged.
- Keep legacy rows readable by falling back to `quantity × unitPrice` only when `printAmount` is absent.

---

### Task 1: Lock decimal and print-total persistence

**Files:**
- Modify: `apps/admin/src/pages/productData.ts`
- Modify: `apps/admin/src/pages/productFormUi.ts`
- Modify: `apps/admin/src/pages/productFormPersistence.ts`
- Test: `apps/admin/tests/productData.test.mjs`
- Test: `apps/admin/tests/productFormPersistence.test.mjs`

**Interfaces:**
- Consumes: existing `QuantityPriceDraft` and grouped product JSONB configuration.
- Produces: `QuantityPriceDraft.printAmount`, decimal input formatting, and `{ quantity, unitPrice, printAmount }` serialization.

- [ ] **Step 1: Add failing tests for decimal formatting and `printAmount` round trips**

```js
assert.equal(formatDecimalNumericValue('001,633.33원'), '1,633.3')
assert.deepEqual(draftRow, {
  quantity: '300',
  unitPrice: '1,633.3',
  printAmount: '490,000',
})
```

- [ ] **Step 2: Run the focused admin model tests and confirm the new assertions fail**

Run: `pnpm --filter admin test:model`
Expected: FAIL because decimal formatting and `printAmount` persistence do not exist.

- [ ] **Step 3: Implement decimal parsing and exact-total persistence**

```ts
export type QuantityPriceDraft = {
  quantity: string
  unitPrice: string
  printAmount: string
}
```

`unitPrice` accepts a finite non-negative decimal; `quantity` and `printAmount` remain safe integers. When an old row lacks `printAmount`, initialize the draft with `quantity × unitPrice` for backward-compatible editing.

- [ ] **Step 4: Run the focused tests and confirm they pass**

Run: `pnpm --filter admin test:model`
Expected: PASS.

### Task 2: Add the editable admin total column

**Files:**
- Modify: `apps/admin/src/pages/ProductFormFields.tsx`
- Modify: `apps/admin/src/pages/ProductFormSectionEditors.tsx`
- Modify: `apps/admin/src/pages/ProductFormFields.css`
- Test: `apps/admin/tests/productFormFields.test.mjs`
- Test: `apps/admin/tests/productFormSectionEditors.test.mjs`

**Interfaces:**
- Consumes: `QuantityPriceDraft.printAmount` from Task 1.
- Produces: the three-column `수량 / 인쇄 단가(원/단위) / 합계(원)` editor and field-targeted validation.

- [ ] **Step 1: Add failing source-contract tests for the new field and three-column layout**

```js
assert.match(source, /field="printAmount"/)
assert.match(source, /인쇄 단가\(원\/단위\)/)
assert.match(source, /합계\(원\)/)
assert.match(styles, /grid-template-columns:\s*repeat\(3,/)
```

- [ ] **Step 2: Run the focused section-editor tests and confirm failure**

Run: `node --test apps/admin/tests/productFormFields.test.mjs apps/admin/tests/productFormSectionEditors.test.mjs`
Expected: FAIL because the third column is absent.

- [ ] **Step 3: Render the decimal and total controls**

Use decimal formatting only for `unitPrice`; keep quantity and total controls integer-formatted. New rows start as `{ quantity: '', unitPrice: '', printAmount: '' }`.

- [ ] **Step 4: Run the focused tests and confirm they pass**

Run: `node --test apps/admin/tests/productFormFields.test.mjs apps/admin/tests/productFormSectionEditors.test.mjs`
Expected: PASS.

### Task 3: Use the entered total in public pricing

**Files:**
- Modify: `packages/supabase/src/productCatalog.ts`
- Modify: `apps/user/app/_content/order.ts`
- Modify: `apps/user/app/(site)/order/OrderOptionSelection.tsx`
- Test: `packages/supabase/tests/product-catalog.test.mjs`
- Test: `apps/user/__tests__/order-page.test.mjs`

**Interfaces:**
- Consumes: quantity rows containing optional legacy `printAmount` and decimal `unitPrice`.
- Produces: parsed `OrderProductQuantityPrice.printAmount`, exact `CalculatedProductSelection.printAmount`, and decimal unit-price display.

- [ ] **Step 1: Add failing calculator tests proving direct totals override multiplication**

```js
const row = { quantity: 300, unitPrice: 1633.3, printAmount: 490000 }
assert.equal(calculated.printAmount, 490000)
```

- [ ] **Step 2: Run the shared catalog and user page tests and confirm failure**

Run: `pnpm --filter @repo/supabase test && pnpm --filter user test`
Expected: FAIL because `printAmount` is not parsed or used directly.

- [ ] **Step 3: Implement exact-total calculation and decimal unit-price formatting**

Read a safe integer `printAmount` when present; otherwise derive the legacy fallback. Calculate `totalPrice = designPrintAmount + planningAmount + printAmount`. Format unit prices with exactly one decimal place, matching the workbook's `ROUND(..., 1)` formulas, without changing whole-won total formatting.

- [ ] **Step 4: Run the focused tests and confirm they pass**

Run: `pnpm --filter @repo/supabase test && pnpm --filter user test`
Expected: PASS.

### Task 4: Verify the integrated change

**Files:**
- Verify: all files modified in Tasks 1-3.

**Interfaces:**
- Consumes: the completed admin, catalog, and public order changes.
- Produces: a regression-tested implementation and a clear database note.

- [ ] **Step 1: Run admin tests, lint, type checks, and builds**

Run: `pnpm --filter admin test && pnpm --filter admin lint && pnpm --filter admin build`
Expected: PASS.

- [ ] **Step 2: Run shared and user tests, lint, type checks, and builds**

Run: `pnpm --filter @repo/supabase test && pnpm --filter @repo/supabase lint && pnpm --filter @repo/supabase check-types && pnpm --filter user test && pnpm --filter user lint && pnpm --filter user check-types && pnpm --filter user build`
Expected: PASS.

- [ ] **Step 3: Run repository safety checks**

Run: `git diff --check`
Expected: no whitespace errors.

Run: `rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages`
Expected: no matches.

- [ ] **Step 4: Confirm database impact**

No SQL schema query is required because `printAmount` is nested inside the existing `products.configuration` JSONB value. Saving a product in the admin writes the new nested key.
