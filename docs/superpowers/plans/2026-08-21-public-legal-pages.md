# Public Legal Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the four approved 씨브레인 legal documents as complete, responsive public pages and connect every existing legal entry point to them.

**Architecture:** Keep each approved legal document as semantic React markup in its own Next.js App Router Server Component. Reuse one presentation-only `LegalDocument` component and CSS module for headers, article rhythm, scrollable tables, notices, warnings, and addenda; keep SEO and JSON-LD in the existing centralized page metadata system.

**Tech Stack:** Next.js 16 App Router, React 19 Server Components, TypeScript, CSS Modules, Node test runner.

**Spec:** `design.md` and the four supplied source documents: `/Users/sangkun/Desktop/01_씨브레인_이용약관 (1).html`, `/Users/sangkun/Desktop/02_씨브레인_개인정보_수집및이용동의 (1).html`, `/Users/sangkun/Desktop/03_씨브레인_개인정보처리방침 (1).html`, `/Users/sangkun/Desktop/04_씨브레인_취소및환불규정 (1).html`.

## Global Constraints

- Preserve the approved Korean wording from the four supplied HTML files; do not silently rewrite legal terms, dates, contact details, or conditions.
- Follow `design.md`: Pretendard GOV Variable weights 500/700, `-0.015em` letter spacing, parent `gap` for related spacing, and existing landing color tokens.
- Keep the pages as Server Components and export static metadata through `createPageMetadata`.
- Do not introduce remote assets or any Figma API URL.
- Preserve all unrelated existing worktree changes under `packages/supabase` and existing plan files.
- Use `/terms` for 이용약관 and `/refund-policy` for 취소 및 환불 규정; retain `/privacy-collection` and `/privacy-policy` for the existing privacy routes.

---

### Task 1: Lock the public legal-page contract with tests

**Files:**

- Create: `apps/user/__tests__/legal-pages.test.mjs`
- Modify: `apps/user/__tests__/structured-data.test.mjs`
- Modify: `apps/user/__tests__/sitemap.test.mjs`

**Interfaces:**

- Consumes: existing route source, `pageSeo`, `sitemapStaticPageKeys`, and footer policy links.
- Produces: regression coverage for four route files, approved section headings and critical policy wording, internal footer destinations, metadata/JSON-LD calls, shared responsive legal styles, and sitemap inclusion.

- [ ] **Step 1: Add a failing route/content test**

  Assert that `/terms`, `/privacy-collection`, `/privacy-policy`, and `/refund-policy` route sources exist. Read each source and assert the approved title plus all article headings: 14 이용약관 articles, 6 개인정보 수집 articles, 11 개인정보처리방침 articles, and 7 취소·환불 articles. Assert representative table/callout wording such as `결제 금액 100% 환불`, `필수 항목에 대한 동의를 거부`, and `2025년 1월 1일부터 시행`.

- [ ] **Step 2: Add failing navigation and presentation tests**

  Assert the footer policy map uses `/terms`, `/privacy-policy`, and `/refund-policy`, renders internal links with `Link`, and never uses `href: "#"`. Assert the shared legal stylesheet consumes `--site-page-top-offset`, uses Pretendard tokens, provides horizontal table scrolling, and includes a mobile breakpoint.

- [ ] **Step 3: Extend metadata and sitemap expectations**

  Add `terms` and `refundPolicy` to the structured-data static page source map and assert `/terms` plus `/refund-policy` occur in generated sitemap paths.

- [ ] **Step 4: Run the tests to confirm the missing routes fail**

  Run: `pnpm --filter user test -- legal-pages.test.mjs structured-data.test.mjs sitemap.test.mjs`

  Expected: FAIL because the two route files and their SEO/sitemap entries do not yet exist and the privacy pages still contain placeholder text.

### Task 2: Build the shared legal-document presentation

**Files:**

- Create: `apps/user/app/(site)/_components/LegalDocument.tsx`
- Create: `apps/user/app/(site)/_components/LegalDocument.module.css`
- Delete: `apps/user/app/(site)/privacy-collection/page.module.css`
- Modify: `apps/user/__tests__/site-page-top-spacing.test.mjs`

**Interfaces:**

- Consumes: `ReactNode`, global landing color variables, `--font-sans`, and `--site-page-top-offset`.
- Produces: `LegalDocument({ children, description, eyebrow, title })` and `LegalTable({ children })` Server Components used by all four routes.

- [ ] **Step 1: Implement the semantic document shell**

  `LegalDocument` renders `<main>`, a constrained `<section>`, a `<header>` containing eyebrow, `<h1>`, and description, followed by a styled legal body. `LegalTable` wraps a semantic `<table>` in a focus-free horizontal scroll container so narrow screens retain every column.

- [ ] **Step 2: Implement design-system-aligned responsive CSS**

  Use a 760px reading column, `var(--site-page-top-offset, 124px)`, 20px mobile gutters, typography tokens from `design.md`, `gap`-driven layout, gray/brand variables, section dividers, ordered/unordered list indentation, 560px minimum table width, subdued note callouts, warning callouts, and addendum blocks. At 640px increase content padding and heading scale without changing the approved type family or weights.

- [ ] **Step 3: Point the page-start spacing regression test to the shared stylesheet**

  Replace the deleted privacy route stylesheet URL with `_components/LegalDocument.module.css` while retaining the `--site-page-top-offset` expectation.

### Task 3: Publish all four approved document bodies

**Files:**

- Create: `apps/user/app/(site)/terms/page.tsx`
- Modify: `apps/user/app/(site)/privacy-collection/page.tsx`
- Modify: `apps/user/app/(site)/privacy-policy/page.tsx`
- Create: `apps/user/app/(site)/refund-policy/page.tsx`

**Interfaces:**

- Consumes: `LegalDocument`, `LegalTable`, `JsonLdScript`, `createPageMetadata`, and `createStaticPageStructuredData`.
- Produces: public Server Component routes `/terms`, `/privacy-collection`, `/privacy-policy`, and `/refund-policy` with complete approved bodies.

- [ ] **Step 1: Add the complete 이용약관 route**

  Render the 14 approved sections covering purpose, definitions, effectiveness/change, services, order formation, payment, content responsibility, proofing, delivery, cancellation/refund, intellectual property, interruption, disclaimer, and dispute resolution. Include the full 2025-01-01 addendum and company contact block.

- [ ] **Step 2: Replace the 개인정보 수집 placeholder**

  Render the complete six-section consent document, including all collection, purpose, retention, third-party provision tables, user rights, refusal warning, and addendum.

- [ ] **Step 3: Replace the 개인정보처리방침 placeholder**

  Render the complete eleven-section policy, including collection/purpose/retention/provider/controller tables, destruction and safety procedures, rights/contact agencies, change notice, and addendum.

- [ ] **Step 4: Add the complete 취소 및 환불 route**

  Render the seven approved sections, cancellation and fault tables, non-refundable cases, damaged-product procedure, 3–5 business day callout, application information, dispute contacts, and addendum.

- [ ] **Step 5: Run the legal page test**

  Run: `node --test apps/user/__tests__/legal-pages.test.mjs`

  Expected: route/content/presentation assertions pass; metadata/navigation assertions remain pending until Task 4.

### Task 4: Connect metadata, sitemap, and navigation

**Files:**

- Modify: `apps/user/app/_content/seo.ts`
- Modify: `apps/user/app/_content/sitemap.ts`
- Modify: `apps/user/app/_components/Footer.tsx`

**Interfaces:**

- Consumes: `StaticPageSeoEntry`, `StaticPageSeoKey`, `createPageMetadata`, `createStaticPageStructuredData`, and Next.js `Link`.
- Produces: `terms` and `refundPolicy` page keys, discoverable sitemap entries, and working footer navigation.

- [ ] **Step 1: Add the two static SEO entries**

  Add `termsSeo` at `/terms` with title `이용약관 | C-Brain` and `refundPolicySeo` at `/refund-policy` with title `취소 및 환불 규정 | C-Brain`; register both in `pageSeo`.

- [ ] **Step 2: Add both pages to the public sitemap**

  Register `terms` and `refundPolicy` in `sitemapStaticPageKeys` and assign yearly change frequency with priority `0.2`, matching the existing privacy policy pages.

- [ ] **Step 3: Wire footer policy links**

  Replace all `#` policy destinations with `/terms`, `/privacy-policy`, and `/refund-policy`, and render them through the already imported Next.js `Link` component.

- [ ] **Step 4: Run focused tests**

  Run: `pnpm --filter user test`

  Expected: all user-app Node tests pass.

### Task 5: Verify production readiness

**Files:**

- Verify only; no new files expected.

**Interfaces:**

- Consumes: completed code and repository scripts.
- Produces: type, lint, build, content-integrity, and forbidden-asset evidence.

- [ ] **Step 1: Format changed source**

  Run Prettier only over this plan and the changed `.ts`, `.tsx`, `.css`, and `.mjs` files.

- [ ] **Step 2: Run type and lint checks**

  Run: `pnpm --filter user check-types && pnpm --filter user lint`

  Expected: both commands exit 0.

- [ ] **Step 3: Build the user app**

  Run: `pnpm --filter user build`

  Expected: Next.js build exits 0 and lists the four public legal routes.

- [ ] **Step 4: Run the required Figma URL scan**

  Run: `rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages`

  Expected: no matches.

- [ ] **Step 5: Review the final diff and worktree isolation**

  Confirm `git diff --` for the legal-page files contains the complete four documents, footer/SEO/sitemap wiring, and tests only; verify unrelated pre-existing `packages/supabase` changes remain untouched.
