# Product Print Unit Prices Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task by task.

**Goal:** Store the supplied option-specific print unit prices and calculate every order total from service estimates, optional planning, quantity, and print unit price.

**Architecture:** Quantity rows use `{ quantity, unitPrice }` only. The shared calculator resolves the selected service rate and multiplier, then computes `service amount + optional planning amount + quantity × unitPrice`. An idempotent migration converts the legacy final-quote values to print unit prices, marks each variant with `priceModel: "service-plus-print-unit-v1"`, and removes temporary `finalPrice` data.

**Tech Stack:** TypeScript, React, Next.js, Vite, Node.js test runner, Supabase JSONB, pnpm/Turborepo.

## Global Constraints

- Preserve unrelated dirty-worktree changes and do not stage or commit.
- Treat final quotes in the supplied sheet as migration inputs only, not runtime source-of-truth values.
- Apply the same multiplier to the service and optional planning rates: brochure page count, fixed six pages for leaflet, flyer side count, business-card people, and logo proposal count.
- Calculate totals from the rounded unit prices exactly as stored, accepting the documented 100–2,000 won differences from 47 spreadsheet final-quote rows.
- Use the server-only Supabase secret only inside the explicit synchronization command and never print it.

---

## Task 1: Lock the formula and price-row contract

- [x] Assert that price rows contain only `quantity` and `unitPrice`.
- [x] Assert `service + quantity × unitPrice` for a brochure selection.
- [x] Assert optional planning is added with the same multiplier.
- [x] Assert the fixed six-page leaflet multiplier.
- [x] Assert the public quantity table labels the value `인쇄 단가`.

## Task 2: Update shared runtime and admin UI

- [x] Calculate order and checkout totals from service, planning, quantity, and unit price.
- [x] Derive product starting prices through the same shared calculator.
- [x] Keep only `수량 / 인쇄 단가` in the admin quantity editor.
- [x] Validate and round-trip only those two row fields.
- [x] Use the package root export in the admin to avoid the Vite subpath-resolution error.

## Task 3: Build and verify the data migration

- [x] Implement round-half-to-even conversion for legacy spreadsheet totals.
- [x] Make dry-run the default and require `--apply` for database writes.
- [x] Mark converted variants with an explicit price model for idempotence.
- [x] Rewrite the seed and verify all 272 quantity rows.
- [x] Confirm a second seed pass reports zero changes.

## Task 4: Apply and audit Supabase

- [x] Dry-run against exactly six published grouped products and 272 rows.
- [x] Apply the unit prices and remove `finalPrice` from every row.
- [x] Read back all products and confirm `finalPrice` occurs zero times.
- [x] Recalculate all 272 selections successfully with the shared formula.
- [x] Verify representative brochure, leaflet, flyer, and envelope prices.

## Task 5: Full regression and UI verification

- [x] Run package, admin, and user tests.
- [x] Run lint, type checks, and builds for affected workspaces.
- [ ] Verify the admin and order pages locally, including an option change (browser connection unavailable; both local servers returned HTTP 200).
- [x] Run `git diff --check`.
- [x] Run `rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages` and require no matches.
