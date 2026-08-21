# Eight-Digit Order Number Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every order a unique eight-digit numeric display number and use it in payment AlimTalk messages without changing NICEPAY's provider order identifier.

**Architecture:** Store the human-facing number on `public.orders.order_number`. PostgreSQL allocates the number under a transaction-scoped advisory lock, checks the unique index, and backfills existing rows; application payment lookups then carry the number into both AlimTalk templates while `payments.provider_order_id` remains unchanged for NICEPAY callbacks, reconciliation, and refunds.

**Tech Stack:** PostgreSQL/Supabase migrations, TypeScript, Next.js, Node test runner

**Spec:** User request in this session dated 2026-08-21.

## Global Constraints

- Order numbers must contain exactly eight decimal digits from `10000000` through `99999999`.
- `orders.order_number` must be non-null and unique for both existing and new orders.
- NICEPAY `payments.provider_order_id` behavior must remain unchanged.
- Public, anonymous, and authenticated roles must not be able to execute the generator directly.
- Existing user-owned worktree changes must be preserved; no git commits are created automatically.

---

### Task 1: Database migration

**Files:**

- Create: `supabase/migrations/*_add_eight_digit_order_numbers.sql`

**Interfaces:**

- Consumes: Existing `public.orders` rows and service-role checkout RPCs.
- Produces: `public.orders.order_number text` with an eight-digit check, unique index, non-null constraint, and default generator.

- [x] Add a migration-created `public.generate_order_number()` function using a transaction advisory lock and bounded collision retry.
- [x] Add `orders.order_number`, set its generator default, backfill all existing orders, and enforce format, uniqueness, and non-null constraints.
- [x] Revoke generator execution from `PUBLIC`, `anon`, and `authenticated`; grant it only to `service_role`.
- [x] Include verification SQL proving zero null, malformed, or duplicate values.

### Task 2: Supabase types and payment lookup

**Files:**

- Modify: `packages/supabase/src/types.ts`
- Modify: `packages/supabase/src/payments.ts`
- Test: `packages/supabase/tests/payment-helpers.test.mjs`

**Interfaces:**

- Consumes: `orders.order_number` from Task 1.
- Produces: `PaymentWithOrder.order.orderNumber: string` for notification consumers.

- [x] Add `order_number` to generated-style order Row, Insert, and Update types.
- [x] Select and map `order_number` in payment-with-order lookups.
- [x] Update the payment lookup fixture and assert the mapped eight-digit number.

### Task 3: AlimTalk display number

**Files:**

- Modify: `apps/user/lib/paymentAlimtalk.ts`
- Test: `apps/user/__tests__/payment-alimtalk.test.mjs`

**Interfaces:**

- Consumes: `PaymentWithOrder.order.orderNumber` from Task 2.
- Produces: Admin and buyer AlimTalk content containing the eight-digit number.

- [x] Replace `PaymentAlimtalkInput.providerOrderId` with `orderNumber` for template rendering.
- [x] Pass `payment.order.orderNumber` from the paid-payment notifier.
- [x] Update exact-template tests and notification fixtures to assert `58310427` while leaving provider IDs untouched elsewhere.

### Task 4: Verification

**Files:**

- Verify all files modified above.

**Interfaces:**

- Consumes: Tasks 1 through 3.
- Produces: Test, type-check, lint, and SQL verification evidence.

- [x] Run focused Supabase and AlimTalk tests.
- [x] Run package type checks and lint checks.
- [x] Validate the migration against a disposable PostgreSQL instance when available; otherwise report the unavailable local dependency explicitly.
- [x] Review the final diff and provide the exact SQL migration and post-deploy verification query to the user.
