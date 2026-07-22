+# Admin table drag ordering implementation plan

> **For implementation:** execute this plan inline. The repository instructions prohibit delegating work to sub-agents.

**Goal:** Let admin list tables opt into drag reordering with `isAcceptDrag`; persist the existing product list order so the user-facing product page can consume the same database order.

**Architecture:** Keep drag mechanics in `AdminDataTableSection` using native HTML drag-and-drop. The product page owns persistence and calls a single PostgreSQL RPC that updates every product's `sort_order` atomically. Static fixture tables remain opt-out until each gets a real data source and ordering field.

**Tech Stack:** React 19, TypeScript, native HTML5 drag-and-drop, Supabase/Postgres, Vitest-compatible Node tests.

---

### Task 1: Add a pure order-moving helper and its unit tests

**Files:**

- Create: `apps/admin/src/components/admin-table/adminTableOrdering.ts`
- Create: `apps/admin/tests/adminTableOrdering.test.mjs`

1. Implement `moveItem(items, fromIndex, toIndex)` to return a copied list with exactly one item moved.
2. Return the original list when either index is outside the list or both indices match.
3. Test forward movement, backward movement, no-op movement, and invalid indices with `node:test`.

### Task 2: Make `AdminDataTableSection` opt-in reorderable

**Files:**

- Modify: `apps/admin/src/components/admin-table/AdminDataTableSection.tsx`
- Modify: `apps/admin/src/components/admin-table/AdminDataTableSection.css`

1. Add `isAcceptDrag?: boolean` and `onRowsReorder?: (rows) => void` props.
2. Enable row reordering only when both props are provided; leave all current tables unchanged by default.
3. Track dragged and drag-over row keys locally, then use `moveItem` to produce the reordered rows on drop.
4. Give enabled rows a clear grab/grabbing cursor and dragged/target visual state. Do not add an icon or dependency.

### Task 3: Persist product order in Supabase

**Files:**

- Create: `supabase/migrations/20260721000001_add_product_sort_order.sql`
- Modify: `packages/supabase/src/types.ts`
- Modify: `packages/supabase/src/products.ts`

1. Add nullable `products.sort_order`, backfill it in the current newest-first product order, then make it non-null.
2. Create a sequence/default so new products append to the end, and add an index on `sort_order`.
3. Create `public.reorder_products(product_ids uuid[])`, callable only by authenticated admins. It must reject a list that does not contain every product exactly once, then update all rows in one statement using `unnest(... ) with ordinality`.
4. Update the typed Supabase schema with `sort_order` and the RPC signature.
5. Change `listAdminProducts` to order ascending by `sort_order` and add a `reorderProducts` wrapper that calls the RPC after the existing admin check.

### Task 4: Enable and save drag ordering on the product page

**Files:**

- Modify: `apps/admin/src/pages/ProductPage.tsx`
- Modify: `apps/admin/tests/productData.test.mjs`

1. Pass `isAcceptDrag` and `onRowsReorder` to the shared table only when the product list is fully loaded, unfiltered, and no reorder request is in flight.
2. Optimistically update the displayed rows, call `reorderProducts` with their IDs, show a success toast, and restore the previous order with an error toast and browser alert on failure.
3. Disable further dragging while the save is pending so concurrent drops cannot overwrite each other.
4. Update existing product fixture data with `sort_order` to satisfy the typed product row contract.

### Task 5: Verify

**Files:**

- No source changes expected.

1. Run `pnpm --filter admin test`.
2. Run `pnpm --filter admin build`.
3. Run the Supabase package type check if exposed by its package scripts.
4. Inspect `git diff --check`.
5. Give the user the migration as the DB query to run; it will be available in the new migration file.
