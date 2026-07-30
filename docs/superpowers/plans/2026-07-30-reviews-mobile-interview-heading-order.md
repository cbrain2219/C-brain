# Reviews Mobile Interview Heading Reordering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** At viewport widths of 640px and below, show the existing customer-interview heading between the featured interview and the interview-card list; keep the current heading-first layout from 641px upward.

**Architecture:** Keep a single semantic heading in the existing DOM so `aria-labelledby="customer-interview-heading"` and the heading ID remain unique. Use mobile-only flex-item `order` rules on every possible direct child of `.reviewsInterviewSection`: featured interview first, heading second, and either the interview grid or empty state third. Do not duplicate JSX or create a mobile-only heading copy.

**Tech Stack:** Next.js 16, React 19, CSS Modules, Node.js `node:test`, local browser responsive verification

## Global Constraints

- Read and follow `design.md` before changing UI.
- The mobile condition is inclusive: `@media (max-width: 640px)`.
- Preserve the existing 72px mobile section gap and use parent `gap`, not child margins.
- Reorder only the customer-interview section; the customer-review heading must remain unchanged.
- Keep exactly one `id="customer-interview-heading"` and one heading referenced by the section's `aria-labelledby`.
- Preserve existing uncommitted work in the shared worktree.
- Do not introduce Figma MCP/API URLs or new assets.

---

### Task 1: Reorder the Customer-Interview Heading on Mobile

**Files:**
- Modify: `apps/user/app/page.module.css:1517-1525`
- Test: `apps/user/__tests__/customer-reviews-page.test.mjs:283-306`
- Inspect only: `apps/user/app/(site)/reviews/page.tsx:147-226`

**Interfaces:**
- Consumes: Existing direct-child classes `.reviewsFeatured`, `.reviewsSectionHeading`, `.reviewsInterviewGrid`, and `.contentEmptyState` inside `.reviewsInterviewSection`.
- Produces: Visual order `featured → heading → grid/empty state` at widths up to 640px, while preserving DOM order and all behavior at 641px and above.

- [ ] **Step 1: Replace the hide-only assertion with a failing responsive-order test**

Add a dedicated test after `customer reviews page includes responsive layout styles`. Remove the existing assertion that requires `display: none` and add:

```js
test("customer interview heading moves below the featured interview through 640px", async () => {
  const [pageSource, stylesSource] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(stylesPath, "utf8"),
  ]);
  const reviewsSectionStart = stylesSource.indexOf(
    ".reviewsInterviewSection",
  );
  const mobileReviewMedia = extractCssBlock(
    stylesSource.slice(reviewsSectionStart),
    "@media (max-width: 640px)",
  );

  assert.equal(
    pageSource.match(/id="customer-interview-heading"/g)?.length,
    1,
  );
  assert.match(
    mobileReviewMedia,
    /\.reviewsInterviewSection > \.reviewsFeatured\s*\{[^}]*order: 1;/s,
  );
  assert.match(
    mobileReviewMedia,
    /\.reviewsInterviewSection > \.reviewsSectionHeading\s*\{[^}]*display: flex;[^}]*order: 2;/s,
  );
  assert.match(
    mobileReviewMedia,
    /\.reviewsInterviewSection > \.reviewsInterviewGrid,[\s\S]*?\.reviewsInterviewSection > \.contentEmptyState\s*\{[^}]*order: 3;/s,
  );
  assert.doesNotMatch(
    mobileReviewMedia,
    /\.reviewsInterviewSection > \.reviewsSectionHeading\s*\{[^}]*display: none;/s,
  );
});
```

- [ ] **Step 2: Run the focused test and confirm the current implementation fails**

Run:

```bash
cd apps/user
node --test __tests__/customer-reviews-page.test.mjs
```

Expected: FAIL in the new responsive-order test because the current mobile rule hides `.reviewsSectionHeading` and defines no child ordering.

- [ ] **Step 3: Replace the mobile hide rule with explicit ordering for every conditional child**

Keep the existing 72px gap and replace the current `display: none` rule in `apps/user/app/page.module.css` with:

```css
@media (max-width: 640px) {
  .reviewsInterviewSection {
    gap: 72px;
  }

  .reviewsInterviewSection > .reviewsFeatured {
    order: 1;
  }

  .reviewsInterviewSection > .reviewsSectionHeading {
    display: flex;
    order: 2;
  }

  .reviewsInterviewSection > .reviewsInterviewGrid,
  .reviewsInterviewSection > .contentEmptyState {
    order: 3;
  }
}
```

Do not change `page.tsx`: the existing single heading must continue to label the whole customer-interview section. Explicitly ordering `.contentEmptyState` prevents the empty-state branch from jumping above the featured interview on mobile.

- [ ] **Step 4: Run the focused test and confirm it passes**

Run:

```bash
cd apps/user
node --test __tests__/customer-reviews-page.test.mjs
```

Expected: all customer-review page tests PASS.

- [ ] **Step 5: Verify both sides of the responsive boundary in the local browser**

Reload `http://localhost:3000/reviews` and inspect computed layout at both widths:

```js
const featured = document.querySelector("article[class*='reviewsFeatured']");
const heading = document.getElementById("customer-interview-heading")?.parentElement;
const grid = document.querySelector("ul[class*='reviewsInterviewGrid']");

({
  featuredTop: featured?.getBoundingClientRect().top,
  headingTop: heading?.getBoundingClientRect().top,
  gridTop: grid?.getBoundingClientRect().top,
  headingDisplay: heading ? getComputedStyle(heading).display : null,
});
```

Expected at 640px:

```text
headingDisplay = "flex"
featuredTop < headingTop < gridTop
```

Expected at 641px:

```text
headingDisplay = "flex"
headingTop < featuredTop < gridTop
```

Also confirm `#customer-review-heading` remains visible at both widths. Reset the temporary viewport override after verification.

- [ ] **Step 6: Run the full regression and repository checks**

Run:

```bash
pnpm --filter user test
git diff --check
rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages
```

Expected: all `user` tests PASS, `git diff --check` exits 0, and the Figma URL search returns no matches.

- [ ] **Step 7: Commit only the responsive-order change and its test**

```bash
git add -p -- apps/user/app/page.module.css apps/user/__tests__/customer-reviews-page.test.mjs
git diff --cached --check
git diff --cached
git commit -m "fix(user): reorder review heading on mobile"
```

Stage only the responsive-order and regression-test hunks. If an interactive hunk contains unrelated pre-existing edits that cannot be split safely, leave it unstaged and do not commit until the owner resolves the shared hunk.
