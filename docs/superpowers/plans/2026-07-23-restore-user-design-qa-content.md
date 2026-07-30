# Restore User Design-QA Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore every user-facing design-QA card and fixture removed during admin preparation, and guarantee that those baseline items remain visible regardless of Supabase/admin connection state.

**Architecture:** Treat the checked-in user fixtures as permanent baseline presentation data for this phase. Published admin rows may be appended after the baseline, but must never replace, hide, or empty it; duplicate remote rows are ignored by a stable domain key. Reuse existing content arrays and styles rather than recreating UI or adding dependencies.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.9, Node built-in test runner, existing Supabase workspace package.

## Global Constraints

- Execute this plan on a new branch/worktree, not directly on `main`.
- Read and follow `design.md` before changing UI.
- Existing QA fixtures must render whether Supabase is unconfigured, configured with zero rows, configured with rows, or returns an error.
- Fixture order is authoritative; non-duplicate published rows are appended after fixtures.
- Do not add dependencies, new remote assets, or new Figma asset URLs.
- Keep existing empty-state UI available for truly empty filtered results, but no top-level page/landing collection may become empty while fixtures exist.
- Before completion, `rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages` must return no matches.

---

## File Map

- Create `apps/user/lib/appendUniqueContent.ts`: shared fixture-first merge used by all connected content loaders.
- Create `apps/user/__tests__/appendUniqueContent.test.mjs`: executable merge invariant check.
- Modify `apps/user/app/_components/BlogSection.tsx`: restore the three landing blog cards from existing `blogPosts`.
- Modify `apps/user/__tests__/blog-page.test.mjs`: lock the landing-card contract.
- Modify `apps/user/app/_components/ServicesSection.tsx`: always retain the nine QA service cards.
- Modify `apps/user/__tests__/services-section.test.mjs`: reverse the current empty-result contract.
- Modify `apps/user/app/_components/PortfolioSection.tsx`: merge landing portfolio rows after QA fixtures.
- Modify `apps/user/app/(site)/portfolio/page.tsx`: merge list rows after QA fixtures.
- Modify `apps/user/app/(site)/portfolio/[slug]/page.tsx`: keep fixture detail routes available.
- Modify `apps/user/__tests__/portfolio-page.test.mjs`: verify fixture-first behavior in all portfolio loaders.
- Modify `apps/user/app/_content/customerReviews.ts`: keep fixture interviews/testimonials/list/detail/landing content visible.
- Modify `apps/user/__tests__/customer-reviews-page.test.mjs`: verify fixture-first review behavior.
- Modify `apps/user/app/(site)/notice/_data/notices.ts`: restore the pre-admin fixture set and merge published notices after it.
- Modify `apps/user/__tests__/notice-pages.test.mjs`: verify fixture count and fixture-first list/detail behavior.

---

### Task 1: Add the fixture-first merge primitive

**Files:**
- Create: `apps/user/lib/appendUniqueContent.ts`
- Create: `apps/user/__tests__/appendUniqueContent.test.mjs`

**Interfaces:**
- Consumes: two readonly arrays and a stable-key selector.
- Produces: `appendUniqueContent<T>(fixtures, published, getKey): T[]`.

- [ ] **Step 1: Write the failing executable test**

```js
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import process from "node:process";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const moduleUrl = new URL("../lib/appendUniqueContent.ts", import.meta.url).href;

test("fixtures stay first and published duplicates cannot replace them", async () => {
  const check = `
    import assert from "node:assert/strict";
    const { appendUniqueContent } = await import(${JSON.stringify(moduleUrl)});
    const fixtures = [{ id: "fixture-a", value: "original" }, { id: "fixture-b", value: "original" }];
    const published = [
      { id: "fixture-a", value: "remote" },
      { id: "remote-c", value: "remote" },
      { id: "remote-c", value: "duplicate remote" },
    ];
    assert.deepEqual(appendUniqueContent(fixtures, published, (item) => item.id), [
      fixtures[0],
      fixtures[1],
      published[1],
    ]);
  `;

  await execFileAsync(
    process.execPath,
    ["--experimental-strip-types", "--input-type=module", "--eval", check],
    { env: { ...process.env, NODE_NO_WARNINGS: "1" } },
  );
});
```

- [ ] **Step 2: Run the test and verify it fails because the module does not exist**

Run: `node --test apps/user/__tests__/appendUniqueContent.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `appendUniqueContent.ts`.

- [ ] **Step 3: Add the minimal merge implementation**

```ts
export function appendUniqueContent<T>(
  fixtures: readonly T[],
  published: readonly T[],
  getKey: (item: T) => string,
): T[] {
  const keys = new Set(fixtures.map(getKey));
  return [
    ...fixtures,
    ...published.filter((item) => {
      const key = getKey(item);
      if (keys.has(key)) return false;
      keys.add(key);
      return true;
    }),
  ];
}
```

- [ ] **Step 4: Run the focused test**

Run: `node --test apps/user/__tests__/appendUniqueContent.test.mjs`

Expected: PASS, 1 test.

- [ ] **Step 5: Commit**

```bash
git add apps/user/lib/appendUniqueContent.ts apps/user/__tests__/appendUniqueContent.test.mjs
git commit -m "test(user): preserve design QA fixtures"
```

---

### Task 2: Restore landing blog cards

**Files:**
- Modify: `apps/user/app/_components/BlogSection.tsx`
- Modify: `apps/user/__tests__/blog-page.test.mjs`

**Interfaces:**
- Consumes: `blogPosts` and each post's existing `landingRank`, `slug`, `image`, `summary`, and dates.
- Produces: the original three-card landing layout without introducing duplicate blog fixture data.

- [ ] **Step 1: Extend the existing blog source-contract test**

Add these assertions to the landing/blog contract test:

```js
assert.match(blogSection, /import Image from "next\/image"/);
assert.match(blogSection, /import \{ blogPosts \}/);
assert.match(blogSection, /post\.landingRank !== undefined/);
assert.match(blogSection, /<HorizontalDragScroll/);
assert.match(blogSection, /className=\{styles\.blogGrid\}/);
assert.match(blogSection, /href=\{`\/blog\/\$\{post\.slug\}`\}/);
assert.match(blogSection, /src=\{post\.image\}/);
assert.match(blogSection, /\{post\.summary\}/);
assert.match(blogSection, /dateTime=\{post\.publishedAtIso\}/);
```

- [ ] **Step 2: Run the focused test and confirm the card assertions fail**

Run: `node --test --test-name-pattern="blog page keeps" apps/user/__tests__/blog-page.test.mjs`

Expected: FAIL because `BlogSection.tsx` currently renders only the heading and “블로그 전체 보기” link.

- [ ] **Step 3: Restore cards from the existing content source**

Add imports for `Image`, `HorizontalDragScroll`, and `blogPosts`. Define:

```ts
const landingPosts = blogPosts
  .filter((post) => post.landingRank !== undefined)
  .sort((firstPost, secondPost) =>
    (firstPost.landingRank ?? Infinity) - (secondPost.landingRank ?? Infinity)
  )
  .slice(0, 3);
```

Render this immediately before the existing `centerAction` block:

```tsx
<HorizontalDragScroll
  ariaLabel="블로그 게시글 목록"
  className={styles.blogGrid}
>
  {landingPosts.map((post) => (
    <Link
      className={styles.blogCard}
      href={`/blog/${post.slug}`}
      key={post.id}
    >
      <div className={styles.blogImage}>
        <Image
          alt={post.title}
          className={styles.coverImage}
          fill
          sizes="(min-width: 1440px) 440px, (min-width: 1080px) 33vw, (min-width: 640px) 400px, 350px"
          src={post.image}
        />
      </div>
      <div className={styles.blogCardBody}>
        <div className={styles.blogCopy}>
          <p className={styles.blogCategory}>{post.category}</p>
          <h3>{post.title}</h3>
          <p>{post.summary}</p>
        </div>
        <time dateTime={post.publishedAtIso}>{post.publishedAt}</time>
      </div>
    </Link>
  ))}
</HorizontalDragScroll>
```

Do not add new card CSS; the original `blogGrid`, `blogCard`, `blogImage`, `blogCardBody`, `blogCopy`, and `blogCategory` rules remain in `app/page.module.css`.

- [ ] **Step 4: Run blog tests**

Run: `node --test apps/user/__tests__/blog-page.test.mjs`

Expected: all blog tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/user/app/_components/BlogSection.tsx apps/user/__tests__/blog-page.test.mjs
git commit -m "fix(user): restore landing blog cards"
```

---

### Task 3: Keep all nine service cards visible

**Files:**
- Modify: `apps/user/app/_components/ServicesSection.tsx`
- Modify: `apps/user/__tests__/services-section.test.mjs`

**Interfaces:**
- Consumes: `appendUniqueContent`, `fallbackServices`, and mapped `PublicProduct` rows.
- Produces: nine fixture cards first; uniquely named published products after them.

- [ ] **Step 1: Reverse the test that currently requires an empty published result to hide fixtures**

Replace the two current fixture-selection tests with assertions for this contract:

```js
assert.match(source, /appendUniqueContent/);
assert.match(
  source,
  /appendUniqueContent\(fallbackServices, publishedServices, \(service\) => service\.title\)/,
);

const fallback = Array.from({ length: 9 }, (_, index) => ({
  title: `fixture-${index}`,
}));
const merge = (published) => [
  ...fallback,
  ...published.filter(
    (product) => !fallback.some((fixture) => fixture.title === product.title),
  ),
];
assert.equal(merge([]).length, 9);
assert.equal(merge([{ title: "fixture-0" }]).length, 9);
assert.equal(merge([{ title: "admin-only" }]).length, 10);
```

Keep the existing assertion that `fallbackServices` contains nine titles.

- [ ] **Step 2: Run the service test and confirm it fails on the old env-only fallback**

Run: `node --test apps/user/__tests__/services-section.test.mjs`

Expected: FAIL because the implementation currently selects either fixtures or products.

- [ ] **Step 3: Merge instead of switching collections**

Import `appendUniqueContent`, then replace the conditional selection with:

```ts
const products = await loadLandingServices();
const publishedServices = products?.map(toServiceCard) ?? [];
const services = appendUniqueContent(
  fallbackServices,
  publishedServices,
  (service) => service.title,
);
```

Keep the current service-card markup unchanged.

- [ ] **Step 4: Run the service and merge tests**

Run: `node --test apps/user/__tests__/appendUniqueContent.test.mjs apps/user/__tests__/services-section.test.mjs`

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/user/app/_components/ServicesSection.tsx apps/user/__tests__/services-section.test.mjs
git commit -m "fix(user): keep baseline service cards"
```

---

### Task 4: Keep portfolio landing, list, and detail fixtures visible

**Files:**
- Modify: `apps/user/app/_components/PortfolioSection.tsx`
- Modify: `apps/user/app/(site)/portfolio/page.tsx`
- Modify: `apps/user/app/(site)/portfolio/[slug]/page.tsx`
- Modify: `apps/user/__tests__/portfolio-page.test.mjs`

**Interfaces:**
- Consumes: `appendUniqueContent`, `featuredPortfolioItems`, `portfolioItems`, and `mapPortfolioRows`.
- Produces: fixture portfolios first, followed by published items with previously unseen slugs.

- [ ] **Step 1: Change portfolio loader tests from fail-closed to fixture-first**

Replace the current “fail closed on query errors” loop with:

```js
for (const source of [listPage, detailPage, landingPortfolio]) {
  assert.match(source, /appendUniqueContent/);
  assert.match(source, /catch \(error\)/);
  assert.match(source, /console\.error\(/);
}
assert.match(listPage, /return portfolioItems/);
assert.match(detailPage, /return portfolioItems/);
assert.match(landingPortfolio, /return featuredPortfolioItems/);
assert.match(listPage, /\(item\) => item\.slug/);
assert.match(detailPage, /\(item\) => item\.slug/);
assert.match(landingPortfolio, /\(item\) => item\.slug/);
```

- [ ] **Step 2: Run the focused portfolio test and confirm the old `return []` behavior fails**

Run: `node --test --test-name-pattern="portfolio loaders" apps/user/__tests__/portfolio-page.test.mjs`

Expected: FAIL because configured empty/error paths currently discard fixtures.

- [ ] **Step 3: Make each portfolio loader fixture-first**

In the landing loader, map published rows and merge them after `featuredPortfolioItems`:

```ts
const rows = await listPublishedPortfolioItems(supabase);
const publishedItems = mapPortfolioRows(
  rows.filter((row) => row.is_landing_enabled),
  (path) => getPublicAssetUrl(supabase, path),
).slice(0, 12);
return appendUniqueContent(
  featuredPortfolioItems,
  publishedItems,
  (item) => item.slug,
);
```

In the list and detail loaders, use the same rule with the complete fixture collection:

```ts
const rows = await listPublishedPortfolioItems(supabase);
const publishedItems = mapPortfolioRows(
  rows,
  (path) => getPublicAssetUrl(supabase, path),
);
return appendUniqueContent(
  portfolioItems,
  publishedItems,
  (item) => item.slug,
);
```

Change each catch return from `[]` to its corresponding fixture collection (`featuredPortfolioItems` for landing, `portfolioItems` for list/detail). Keep current error logging.

- [ ] **Step 4: Run portfolio tests**

Run: `node --test apps/user/__tests__/portfolio-content.test.mjs apps/user/__tests__/portfolio-page.test.mjs`

Expected: all portfolio tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/user/app/_components/PortfolioSection.tsx 'apps/user/app/(site)/portfolio/page.tsx' 'apps/user/app/(site)/portfolio/[slug]/page.tsx' apps/user/__tests__/portfolio-page.test.mjs
git commit -m "fix(user): preserve portfolio QA content"
```

---

### Task 5: Keep review list, landing, featured, and detail fixtures visible

**Files:**
- Modify: `apps/user/app/_content/customerReviews.ts`
- Modify: `apps/user/__tests__/customer-reviews-page.test.mjs`

**Interfaces:**
- Consumes: `appendUniqueContent`, existing interview/testimonial fixtures, and published review mappings.
- Produces: fixture content first, unique published reviews after it, and fixture detail routes that never depend on Supabase.

- [ ] **Step 1: Replace fail-closed source assertions with fixture-first assertions**

Use these checks in the loader test:

```js
assert.match(contentSource, /appendUniqueContent/);
assert.match(contentSource, /appendUniqueContent\([\s\S]*customerInterviews/);
assert.match(contentSource, /appendUniqueContent\([\s\S]*customerTestimonials/);
assert.match(contentSource, /\(interview\) => interview\.detailSlug/);
assert.match(contentSource, /\(testimonial\) => testimonial\.id/);
assert.match(
  contentSource,
  /const fixture = getCustomerInterviewDetailBySlug\(slug\);/,
);
assert.match(contentSource, /if \(fixture\) return fixture;/);
assert.match(contentSource, /catch \(error\)[\s\S]*return fixture/);
```

Remove assertions requiring `return []` and `return undefined` on query errors.

- [ ] **Step 2: Run the focused review-loader test and confirm failure**

Run: `node --test --test-name-pattern="review loaders" apps/user/__tests__/customer-reviews-page.test.mjs`

Expected: FAIL because the current configured path can return empty collections and hide the representative interview.

- [ ] **Step 3: Merge page and landing data after fixtures**

After mapping published reviews in `getCustomerReviewPageData`, return:

```ts
return {
  customerInterviews: appendUniqueContent(
    customerInterviews,
    interviewEntries.map(({ card }) => card),
    (interview) => interview.detailSlug,
  ),
  customerTestimonials: appendUniqueContent(
    customerTestimonials,
    publishedTestimonials,
    (testimonial) => testimonial.id,
  ),
  featuredCustomerInterview,
};
```

The existing fixture `featuredCustomerInterview` remains the displayed representative interview; published entries remain available in the grid.

In `getLandingCustomerTestimonials`, map the published landing rows, then return:

```ts
return appendUniqueContent(
  customerTestimonials.slice(0, 3),
  publishedTestimonials,
  (testimonial) => testimonial.id,
);
```

- [ ] **Step 4: Resolve fixture detail before consulting Supabase**

Use this structure in `getPublishedCustomerInterviewDetailBySlug`:

```ts
const fixture = getCustomerInterviewDetailBySlug(slug);
if (fixture) return fixture;

const client = await createUserSupabaseClient();
if (!client) return undefined;

try {
  const review = await getPublishedReview(client, slug);
  return review ? toPublishedInterviewDetail(client, review) : undefined;
} catch (error) {
  console.error("Failed to load published review detail.", error);
  return fixture;
}
```

- [ ] **Step 5: Run review tests**

Run: `node --test apps/user/__tests__/customer-review-detail-page.test.mjs apps/user/__tests__/customer-reviews-page.test.mjs`

Expected: all review tests PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/user/app/_content/customerReviews.ts apps/user/__tests__/customer-reviews-page.test.mjs
git commit -m "fix(user): preserve review QA content"
```

---

### Task 6: Restore the full notice fixture set and keep it authoritative

**Files:**
- Modify: `apps/user/app/(site)/notice/_data/notices.ts`
- Modify: `apps/user/__tests__/notice-pages.test.mjs`

**Interfaces:**
- Consumes: the exact pre-removal fixture block from parent commit `932c5bd^`, `appendUniqueContent`, and published notice mappings.
- Produces: the original 15 notices and their detail content on every environment, plus unique published notices.

- [ ] **Step 1: Add fixture-count and fixture-first tests**

Add a fixture count check and replace fail-closed assertions:

```js
const fixtureBlock = data.slice(
  data.indexOf("const noticeFixtures = ["),
  data.indexOf("] satisfies NoticeSummary[];"),
);
assert.equal(fixtureBlock.match(/\bid: "/g)?.length, 15);
assert.match(data, /appendUniqueContent/);
assert.match(data, /appendUniqueContent\(noticeFixtures, publishedNotices/);
assert.match(data, /\(notice\) => notice\.id/);
assert.match(data, /const fixture = noticeFixtures\.find/);
assert.match(data, /if \(fixture\) return toNoticeDetailFixture\(fixture\)/);
assert.doesNotMatch(data, /Failed to load published notices[\s\S]*return \[\]/);
```

- [ ] **Step 2: Run notice tests and confirm fixture count fails**

Run: `node --test apps/user/__tests__/notice-pages.test.mjs`

Expected: FAIL because only two fallback notices remain and errors currently return empty/undefined.

- [ ] **Step 3: Recover the exact deleted fixture source for reference**

Run this read-only command:

```bash
git show 932c5bd^:'apps/user/app/(site)/notice/_data/notices.ts' | sed -n '1,260p'
```

Restore the exact 15-item `noticeFixtures` array and `sharedDetailContent` block shown by that command. Keep the current published-post mapping functions below it. Use the original `NoticeSummary[]` fixture type, and add this adapter:

```ts
function toNoticeDetailFixture(notice: NoticeSummary): NoticeDetail {
  return {
    ...notice,
    content: [
      { text: notice.excerpt, type: "paragraph" },
      ...sharedDetailContent,
    ],
  };
}
```

- [ ] **Step 4: Make list and detail fixture-first**

Change `listNotices` to:

```ts
const fixtureNotices = noticeFixtures
  .map(toNoticeDetailFixture)
  .sort(compareFixtureNotices);
const client = await createUserSupabaseClient();
if (!client) return fixtureNotices;

try {
  const posts = await listPublishedPosts(client, "notice");
  const publishedNotices = [...posts]
    .sort(comparePublishedPosts)
    .map(toNoticeDetail);
  return appendUniqueContent(
    fixtureNotices,
    publishedNotices,
    (notice) => notice.id,
  );
} catch (error) {
  console.error("Failed to load published notices.", error);
  return fixtureNotices;
}
```

At the start of `getNoticeById`, resolve the fixture first:

```ts
const fixture = noticeFixtures.find((notice) => notice.id === id);
if (fixture) return toNoticeDetailFixture(fixture);
```

Then keep the current Supabase slug/id lookup for non-fixture routes. On query failure, return `undefined`; fixture routes have already returned before that point.

- [ ] **Step 5: Run notice tests**

Run: `node --test apps/user/__tests__/notice-pages.test.mjs`

Expected: all notice tests PASS and the source check counts 15 fixtures.

- [ ] **Step 6: Commit**

```bash
git add 'apps/user/app/(site)/notice/_data/notices.ts' apps/user/__tests__/notice-pages.test.mjs
git commit -m "fix(user): restore notice QA fixtures"
```

---

### Task 7: Full verification and design-QA handoff

**Files:**
- Verify only; no planned source changes.

**Interfaces:**
- Consumes: all restored fixture-first loaders and UI sections.
- Produces: a branch ready for visual QA and later admin integration work.

- [ ] **Step 1: Run all user tests**

Run: `pnpm --filter user test`

Expected: PASS with zero failed tests.

- [ ] **Step 2: Run type and lint checks**

Run: `pnpm --filter user check-types && pnpm --filter user lint`

Expected: both commands exit 0.

- [ ] **Step 3: Build the user app**

Run: `pnpm --filter user build`

Expected: production build succeeds and all user routes compile.

- [ ] **Step 4: Run the required Figma URL check**

Run: `rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages`

Expected: no output and exit code 1 (no matches).

- [ ] **Step 5: Visually inspect fixture-presence routes**

Run: `pnpm --filter user dev`

Verify at desktop and mobile widths:

- `/`: nine service cards, portfolio cards, three customer-review cards, and three blog cards are visible.
- `/portfolio`: fixture grid is visible and fixture detail links open.
- `/reviews`: fixture featured interview, interview cards, and testimonial cards are visible.
- `/notice`: all 15 fixture notices are reachable across categories and detail pages open.

Repeat the same checks once with Supabase env vars absent and once with Supabase configured. Expected: baseline fixture cards remain visible in both states; unique published rows appear only after the baseline.

- [ ] **Step 6: Commit any test-only corrections, then report branch name and verification output**

Do not change product behavior during this step. If no corrections are needed, leave the prior commits as-is.

---

## Self-Review

- Coverage: landing blog, services, portfolio landing/list/detail, reviews landing/list/detail, and notice list/detail are all included.
- Invariant: no loader is allowed to replace a non-empty fixture collection with an empty or partial published collection.
- Reuse: existing fixture arrays, images, CSS, icons, and published-row mappers are reused; only one small merge helper is added.
- Deferred intentionally: actual admin ownership/removal of QA fixtures requires a separate explicit product decision and is not part of this recovery branch.
