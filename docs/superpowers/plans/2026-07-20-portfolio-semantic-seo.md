# Portfolio Semantic SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the portfolio UI while giving every portfolio card semantic HTML and adding representative-image metadata to detail pages.

**Architecture:** Keep the existing portfolio data and client-side category behavior. Store representative-image alt text with each portfolio item, wrap existing cards with native semantic elements, and reuse the stored value in card images and Next.js metadata.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS Modules, Node test runner

## Global Constraints

- Keep the existing visual styling, category switching, URL updates, and scroll restoration behavior.
- Read representative and detail-image alt text from the values authored in the admin.
- Do not compose or overwrite alt text in the user frontend.
- Do not add JSON-LD, category routes, sitemap, canonical URL handling, or dependencies.
- Resolve social image URLs from `NEXT_PUBLIC_SITE_URL`; omit them when the variable is unavailable.

---

### Task 1: Semantic portfolio cards and stored alt text

**Files:**
- Modify: `apps/user/__tests__/portfolio-page.test.mjs`
- Modify: `apps/user/app/_content/portfolio.ts`
- Modify: `apps/user/app/(site)/portfolio/PortfolioGallery.tsx`
- Modify: `apps/user/app/(site)/portfolio/page.module.css`

**Interfaces:**
- Produces: required `PortfolioItem.imageAlt: string`
- Produces: semantic `ul > li > article > a > figure` portfolio cards

- [ ] **Step 1: Write the failing test**

Assert that the content module requires `imageAlt`, the gallery uses `ul`, `li`, `article`, `figure`, and `figcaption`, and card images read `item.imageAlt`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test apps/user/__tests__/portfolio-page.test.mjs`
Expected: FAIL because the stored alt field and semantic card elements do not exist.

- [ ] **Step 3: Write the minimal implementation**

Add the admin/API data field:

```ts
imageAlt: string;
```

Change the card collection to `ul`, wrap each item in `li` and `article`, and use `figure` with `figcaption`. Render `item.imageAlt` unchanged and reset only list and figure browser defaults in the existing CSS module.

- [ ] **Step 4: Run the focused test**

Run: `node --test apps/user/__tests__/portfolio-page.test.mjs`
Expected: PASS.

### Task 2: Semantic related cards and image metadata

**Files:**
- Modify: `apps/user/__tests__/portfolio-page.test.mjs`
- Modify: `apps/user/app/(site)/portfolio/[slug]/page.tsx`
- Modify: `apps/user/app/(site)/portfolio/[slug]/page.module.css`

**Interfaces:**
- Consumes: `PortfolioItem.imageAlt`
- Produces: semantic related portfolio cards and Open Graph/Twitter image metadata

- [ ] **Step 1: Extend the failing test**

Assert that related cards use `ul`, `li`, `article`, `figure`, and `figcaption`, and that Open Graph and Twitter metadata both include `images` using `item.image` and `item.imageAlt`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test apps/user/__tests__/portfolio-page.test.mjs`
Expected: FAIL because related-card semantics and image metadata are missing.

- [ ] **Step 3: Write the minimal implementation**

Add the image metadata to `generateMetadata`, render the stored alt on related cards, and wrap each related card with the same semantic structure. Reset only the related list and figure defaults in its CSS module.

- [ ] **Step 4: Verify the complete change**

Run:

```bash
node --test apps/user/__tests__/*.test.mjs
corepack pnpm --filter user check-types
corepack pnpm --filter user lint
corepack pnpm --filter user build
```

Expected: all commands pass. Confirm desktop and mobile card dimensions, spacing, links, and images in the browser.
