# Review Request Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an admin button that copies a public review-request URL and a Figma-matched public form that always stores submitted customer reviews as drafts.

**Architecture:** The admin Vite app copies a stable `/reviews/request` URL derived from `VITE_USER_APP_URL`. The public Next.js page submits a strictly validated JSON payload to a server-only route; that route uses the existing secret-key Supabase client and a narrow persistence helper that forces `kind = 'testimonial'`, `status = 'draft'`, and `show_on_landing = false`. A nullable, constrained `reviews.rating` column preserves the form's 1–5 satisfaction score without changing existing published rows.

**Tech Stack:** React 19, Next.js 16 App Router, Vite, TypeScript, CSS Modules, Supabase/Postgres, Node test runner, Vitest

**Spec:** `design.md`; Figma nodes `qZcNE6of4hWidBcayhacSI:332:2963` and `qZcNE6of4hWidBcayhacSI:1436:5200`

## Global Constraints

- Follow `design.md`: Pretendard GOV Variable typography, `-0.015em` letter spacing, shared `Icon`/`AdminIcon` components, parent `gap` spacing, and no custom input focus styling.
- Never keep `https://www.figma.com/api/mcp/asset/*` or `https://www.figma.com/api/*` URLs in application source.
- The public client may send only company name, manager name/title, product category, rating, and review content.
- The persistence boundary must force testimonial kind, draft status, and disabled landing exposure regardless of request payload.
- Existing rows with no rating remain valid; the new rating column is nullable and accepts only integers from 1 through 5.
- Do not change the existing blog or published-review listing behavior except where a future consumer reads the new nullable rating field.

---

### Task 1: Review Rating and Draft Persistence Contract

**Files:**
- Create: `supabase/migrations/20260821025443_add_review_rating.sql`
- Modify: `supabase/initial_admin_content.sql`
- Modify: `packages/supabase/src/types.ts`
- Modify: `packages/supabase/src/reviews.ts`
- Test: `packages/supabase/tests/review-submission-contract.test.mjs`

**Interfaces:**
- Consumes: `createAdminSupabaseClient(): CBrainSupabaseClient` and `TableInsert<'reviews'>`.
- Produces: `createReviewSubmissionDraft(client, input): Promise<{ id: string; status: PublishStatus }>` and `ReviewSubmissionDraftInput` containing only customer-entered review fields.

- [ ] **Step 1: Write the failing SQL and helper contract test**

```js
test('review submission migration constrains ratings and the helper fixes draft fields', async () => {
  assert.match(migration, /add column if not exists rating smallint/)
  assert.match(migration, /rating between 1 and 5/)
  assert.match(source, /kind: "testimonial"/)
  assert.match(source, /status: "draft"/)
  assert.match(source, /show_on_landing: false/)
})
```

- [ ] **Step 2: Run the contract test and verify it fails**

Run: `pnpm --filter @repo/supabase exec node --test tests/review-submission-contract.test.mjs`

Expected: FAIL because the migration, `rating` type, and submission helper do not exist.

- [ ] **Step 3: Add the nullable constrained column and narrow helper**

```sql
alter table public.reviews
  add column if not exists rating smallint;

alter table public.reviews
  add constraint reviews_rating_range_check
  check (rating is null or rating between 1 and 5) not valid;

alter table public.reviews
  validate constraint reviews_rating_range_check;

grant select (rating) on table public.reviews to anon;
```

```ts
export async function createReviewSubmissionDraft(
  client: CBrainSupabaseClient,
  input: ReviewSubmissionDraftInput,
) {
  const { data, error } = await client
    .from("reviews")
    .insert({
      ...input,
      kind: "testimonial",
      show_on_landing: false,
      status: "draft",
    })
    .select("id, status")
    .single();

  return unwrapSupabaseData(data, error);
}
```

- [ ] **Step 4: Run package tests and type checking**

Run: `pnpm --filter @repo/supabase test && pnpm --filter @repo/supabase check-types`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260821025443_add_review_rating.sql supabase/initial_admin_content.sql packages/supabase/src/types.ts packages/supabase/src/reviews.ts packages/supabase/tests/review-submission-contract.test.mjs
git commit -m "feat: add draft review submission contract"
```

### Task 2: Public Submission Validation and Server Route

**Files:**
- Create: `apps/user/app/reviews/request/reviewSubmission.ts`
- Create: `apps/user/app/api/review-submissions/route.ts`
- Test: `apps/user/__tests__/review-submission.test.mjs`
- Test: `apps/user/__tests__/review-submission-route.test.mjs`

**Interfaces:**
- Consumes: `portfolioTypes`, `createAdminSupabaseClient()`, and `createReviewSubmissionDraft()` from Task 1.
- Produces: `ReviewSubmissionValues`, `reviewProductTypeOptions`, `parseReviewSubmission(input)`, `validateReviewSubmission(values)`, and `toReviewSubmissionDraftInput(values)`.

- [ ] **Step 1: Write failing parser and route tests**

```js
const parsed = parseReviewSubmission({
  companyName: ' 씨브레인 ',
  managerName: ' 김담당 팀장 ',
  productType: '브로슈어 · 카탈로그',
  rating: 5,
  content: '<좋았어요>\n빠른 제작이었습니다.',
})
assert.equal(parsed.ok, true)
assert.equal(parseReviewSubmission({ ...valid, rating: 6 }).ok, false)
assert.equal(parseReviewSubmission({ ...valid, status: 'published' }).ok, true)
```

The route source test must assert that it calls `createAdminSupabaseClient()`, parses unknown JSON, calls `createReviewSubmissionDraft()`, returns HTTP 201 on success, and never reads `status`, `kind`, or `show_on_landing` from the request.

- [ ] **Step 2: Run the user tests and verify they fail**

Run: `pnpm --filter user exec node --test __tests__/review-submission.test.mjs __tests__/review-submission-route.test.mjs`

Expected: FAIL because the parser and route do not exist.

- [ ] **Step 3: Implement strict parsing and safe managed content**

```ts
export function toReviewSubmissionDraftInput(values: ReviewSubmissionValues) {
  const lines = values.content.split(/\r?\n/u)

  return {
    company_name: values.companyName,
    content: lines.map((line) => `<p>${escapeHtml(line)}</p>`).join(''),
    content_authoring_mode: 'wysiwyg' as const,
    content_json: {
      type: 'doc',
      content: lines.map((line) => ({
        type: 'paragraph',
        ...(line ? { content: [{ type: 'text', text: line }] } : {}),
      })),
    },
    content_mode: 'html' as const,
    content_schema_version: 1,
    manager_name: values.managerName,
    product_type: values.productType,
    rating: values.rating,
  }
}
```

The parser trims strings, caps company/manager names at 100 characters and content at 20,000 characters, accepts only the shared review product options, and requires an integer rating from 1 through 5.

- [ ] **Step 4: Implement the server-only POST route**

```ts
export async function POST(request: Request) {
  const submission = parseReviewSubmission(await request.json().catch(() => null))
  if (!submission.ok) {
    return NextResponse.json({ error: submission.error }, { status: 400 })
  }

  const client = createAdminSupabaseClient()
  const review = await createReviewSubmissionDraft(
    client,
    toReviewSubmissionDraftInput(submission.values),
  )
  return NextResponse.json({ id: review.id }, { status: 201 })
}
```

- [ ] **Step 5: Run focused user tests**

Run: `pnpm --filter user exec node --test __tests__/review-submission.test.mjs __tests__/review-submission-route.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/user/app/reviews/request/reviewSubmission.ts apps/user/app/api/review-submissions/route.ts apps/user/__tests__/review-submission.test.mjs apps/user/__tests__/review-submission-route.test.mjs
git commit -m "feat: accept public review draft submissions"
```

### Task 3: Figma-Matched Public Review Request Form

**Files:**
- Create: `apps/user/app/reviews/request/page.tsx`
- Create: `apps/user/app/reviews/request/ReviewRequestForm.tsx`
- Create: `apps/user/app/reviews/request/page.module.css`
- Modify: `apps/user/components/Icon.tsx`
- Test: `apps/user/__tests__/review-request-page.test.mjs`

**Interfaces:**
- Consumes: `ReviewSubmissionValues`, `reviewProductTypeOptions`, and POST `/api/review-submissions` from Task 2.
- Produces: public page `/reviews/request` with company, manager/title, product category, 1–5 rating, and review content fields.

- [ ] **Step 1: Write the failing page contract test**

```js
assert.match(form, /후기 등록 요청/)
assert.match(form, /회사명/)
assert.match(form, /담당자명 · 직위/)
assert.match(form, /의뢰하신 제품/)
assert.match(form, /만족도/)
assert.match(form, /후기 내용/)
assert.match(form, /fetch\("\/api\/review-submissions"/)
assert.match(styles, /max-width:\s*390px/)
assert.match(styles, /height:\s*320px/)
```

- [ ] **Step 2: Run the page contract test and verify it fails**

Run: `pnpm --filter user exec node --test __tests__/review-request-page.test.mjs`

Expected: FAIL because the page and form files do not exist.

- [ ] **Step 3: Register the exact filled star glyph from Figma**

Add `star-filled` to the shared `IconName` registry using the exported Figma star path, a `43.6151 41.6` view box, and `fill="currentColor"`; do not keep the temporary Figma asset URL.

- [ ] **Step 4: Implement the accessible client form**

```tsx
<fieldset className={styles.ratingField}>
  <legend>만족도</legend>
  <div aria-label="만족도 선택" className={styles.ratingOptions}>
    {[1, 2, 3, 4, 5].map((value) => (
      <label className={styles.ratingOption} key={value}>
        <input
          aria-label={`${value}점`}
          checked={rating === value}
          name="rating"
          onChange={() => setRating(value)}
          type="radio"
        />
        <Icon name="star-filled" size={44} />
      </label>
    ))}
  </div>
</fieldset>
```

Use the existing `Icon` component for arrow-left, chevron-down, arrow-right, and the registered filled star. Default the rating to 1 as shown in the Figma state, disable repeat submission after success, and show an inline `role="status"` or `role="alert"` message.

- [ ] **Step 5: Implement the 390px Figma layout**

Create a standalone root-layout page (outside `(site)`) so it has the 52px request header but not the marketing header/footer. Match the 20px horizontal padding, 32px top padding, 20px field gap, 52px submit separation, 52px controls, 16px radii, 320px textarea, #30BAC3 primary color, and responsive full-width behavior below 390px. Omit the drawn iOS status bar and home indicator because the browser owns those surfaces.

- [ ] **Step 6: Run focused tests, lint, and type checking**

Run: `pnpm --filter user exec node --test __tests__/review-request-page.test.mjs __tests__/review-submission.test.mjs __tests__/review-submission-route.test.mjs`

Run: `pnpm --filter user lint && pnpm --filter user check-types`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/user/app/reviews/request apps/user/components/Icon.tsx apps/user/__tests__/review-request-page.test.mjs
git commit -m "feat: add public review request form"
```

### Task 4: Admin Review Link Copy Action

**Files:**
- Modify: `apps/admin/src/components/admin-table/AdminDataTableSection.tsx`
- Modify: `apps/admin/src/components/admin-table/AdminDataTableSection.css`
- Modify: `apps/admin/src/pages/ReviewPage.tsx`
- Test: `apps/admin/tests/reviewRequestLink.test.mjs`

**Interfaces:**
- Consumes: `VITE_USER_APP_URL`, `AdminIcon name="link"`, and public path `/reviews/request` from Task 3.
- Produces: `bottomLeadingAction` support in `AdminDataTableSection` and a review-page copy handler with success/failure feedback.

- [ ] **Step 1: Write the failing admin action test**

```js
assert.match(page, /VITE_USER_APP_URL/)
assert.match(page, /new URL\('\/reviews\/request'/)
assert.match(page, /navigator\.clipboard\.writeText/)
assert.match(page, /후기 등록 링크 복사/)
assert.match(table, /bottomLeadingAction/)
assert.ok(table.indexOf('bottomLeadingAction') < table.lastIndexOf('bottomAction'))
```

- [ ] **Step 2: Run the admin model test and verify it fails**

Run: `pnpm --filter admin exec node --test tests/reviewRequestLink.test.mjs`

Expected: FAIL because the copy action is absent.

- [ ] **Step 3: Add a generic leading bottom button**

```ts
export type AdminTableButtonAction = {
  readonly label: string
  readonly onClick: () => void
}
```

Render the leading `<button>` before the existing registration `<Link>` in an `.admin-data-table-section__actions` wrapper. Both controls retain the existing 40px pill treatment; the leading control uses `<AdminIcon name="link" size={20} />`.

- [ ] **Step 4: Wire the review request URL copy behavior**

```ts
const userAppUrl = import.meta.env.VITE_USER_APP_URL || 'http://localhost:3000'
const reviewRequestUrl = new URL('/reviews/request', userAppUrl).toString()

async function handleCopyReviewRequestUrl() {
  try {
    await navigator.clipboard.writeText(reviewRequestUrl)
    toast.success('후기 등록 링크를 복사했습니다.')
  } catch {
    toast.error('후기 등록 링크를 복사하지 못했습니다.')
  }
}
```

- [ ] **Step 5: Run admin tests, lint, and build checks**

Run: `pnpm --filter admin test && pnpm --filter admin lint && pnpm --filter admin build`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/admin/src/components/admin-table/AdminDataTableSection.tsx apps/admin/src/components/admin-table/AdminDataTableSection.css apps/admin/src/pages/ReviewPage.tsx apps/admin/tests/reviewRequestLink.test.mjs
git commit -m "feat: copy public review request link"
```

### Task 5: End-to-End Verification and Asset Guard

**Files:**
- Verify: all files changed in Tasks 1–4

**Interfaces:**
- Consumes: public request page, POST route, Supabase draft helper, and admin copy action.
- Produces: verified implementation evidence with no remote Figma assets.

- [ ] **Step 1: Run all affected test suites**

Run: `pnpm --filter @repo/supabase test && pnpm --filter user test && pnpm --filter admin test`

Expected: PASS.

- [ ] **Step 2: Run static checks**

Run: `pnpm --filter @repo/supabase check-types && pnpm --filter user check-types && pnpm --filter admin build`

Run: `pnpm --filter @repo/supabase lint && pnpm --filter user lint && pnpm --filter admin lint`

Expected: PASS.

- [ ] **Step 3: Run the required Figma URL guard**

Run: `rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages`

Expected: no matches.

- [ ] **Step 4: Inspect the final diff**

Run: `git diff --check && git status --short`

Expected: no whitespace errors; only this feature plus the user's pre-existing untracked plan files are present.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/plans/2026-08-21-review-request-form.md
git commit -m "docs: record review request form plan"
```
