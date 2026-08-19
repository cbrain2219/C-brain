# Admin HTML Authoring Default Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `HTML 작성` the initial selection on every admin managed-content creation page while preserving the stored authoring mode on edit pages.

**Architecture:** Let the shared managed-content factory accept an optional initial authoring mode while retaining its existing WYSIWYG default for generic editor consumers. Pass `raw_html` explicitly from the portfolio, blog, review, and notice creation-form factories. Keep row-to-form hydration unchanged so edit routes continue to use each database row's `content_authoring_mode`.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Node test runner

**Spec:** `design.md` and the current user requirement for admin creation-page defaults

## Global Constraints

- `HTML 작성` must be selected initially on `/portfolio/new`, `/blog/new`, `/reviews/new`, and `/notices/new`.
- `TEXT Editor 작성` must remain selectable.
- Edit routes must preserve the stored `content_authoring_mode` from the database.
- Do not change labels, typography, spacing, icons, or other form behavior.
- Do not add Figma MCP asset URLs to application source.
- Preserve unrelated working-tree changes.

---

### Task 1: Default new managed content to raw HTML

**Files:**
- Modify: `apps/admin/src/lib/managedContent.ts`
- Modify: `apps/admin/src/pages/PortfolioFormPage.tsx`
- Modify: `apps/admin/src/pages/blogData.ts`
- Modify: `apps/admin/src/pages/noticeData.ts`
- Modify: `apps/admin/src/pages/reviewData.ts`
- Modify: `apps/admin/tests/managedContent.test.mjs`
- Modify: `apps/admin/tests/adminContentEditorIntegration.test.mjs`
- Modify: `apps/admin/src/pages/ReviewFormPage.test.tsx`
- Modify: `apps/admin/tests/blogData.test.mjs`
- Modify: `apps/admin/tests/noticeData.test.mjs`
- Modify: `apps/admin/tests/reviewData.test.mjs`

**Interfaces:**
- Consumes: `ContentAuthoringMode` and the existing `createInitialManagedContentValue()` factory.
- Produces: `createInitialManagedContentValue(contentAuthoringMode?: ContentAuthoringMode): ManagedContentFormValue`; omitted mode remains `wysiwyg`, and all four creation-form factories pass `raw_html`.
- Preserves: `managedContentFormFromRow(row): ManagedContentFormValue`, which continues to hydrate edit forms from stored values.

- [x] **Step 1: Write failing shared-default and UI tests**

Update the shared-value test to assert the new mode explicitly:

```js
test('creates raw HTML content with an empty recoverable editor document', () => {
  const initial = createInitialManagedContentValue('raw_html')

  assert.equal(initial.content, '')
  assert.equal(initial.contentAuthoringMode, 'raw_html')
  assert.equal(initial.contentMode, 'html')
  assert.equal(managedContentDocumentIsEmpty(initial.contentJson), true)
})
```

Add a creation-page assertion in `ReviewFormPage.test.tsx` before switching modes:

```tsx
expect(screen.getByRole('button', { name: 'HTML 작성' }).getAttribute('aria-pressed')).toBe('true')
expect(screen.getByRole('button', { name: 'TEXT Editor 작성' }).getAttribute('aria-pressed')).toBe('false')
expect(screen.getByRole('textbox', { name: '본문 HTML' })).toBeTruthy()
```

Add a source integration assertion that each creation factory passes `raw_html`:

```js
for (const source of [blogData, noticeData, portfolioPage, reviewData]) {
  assert.match(source, /createInitialManagedContentValue\('raw_html'\)/)
}
```

For the exported blog, notice, and review form factories, add direct assertions that their initial `contentAuthoringMode` equals `raw_html`.

- [x] **Step 2: Run the focused tests and verify the new assertion fails**

Run:

```bash
pnpm --filter admin exec node --experimental-strip-types --test --test-name-pattern="creates raw HTML content" tests/managedContent.test.mjs
pnpm --filter admin exec vitest run src/pages/ReviewFormPage.test.tsx
```

Expected: the raw-HTML factory assertion and creation-page assertion fail because the factory cannot yet accept the mode and the forms still omit it.

- [x] **Step 3: Add the explicit initial mode and apply it to creation forms**

Update the shared factory without changing its generic default:

```ts
export function createInitialManagedContentValue(
  contentAuthoringMode: ContentAuthoringMode = 'wysiwyg',
): ManagedContentFormValue {
  return {
    content: '',
    contentAssetScope: crypto.randomUUID().toLowerCase(),
    contentAuthoringMode,
    contentJson: EMPTY_TIPTAP_DOCUMENT,
    contentMode: 'html',
    contentSchemaVersion: SUPPORTED_CONTENT_SCHEMA_VERSION,
    contentSourceBackup: null,
  }
}
```

In `createInitialPortfolioForm`, `createInitialBlogForm`, `createInitialNoticeForm`, and `createInitialReviewForm`, replace the shared call with:

```ts
...createInitialManagedContentValue('raw_html'),
```

- [x] **Step 4: Keep intentionally WYSIWYG test fixtures explicit**

Add `contentAuthoringMode: 'wysiwyg'` to notice and review model fixtures whose purpose is to verify WYSIWYG serialization or semantic WYSIWYG emptiness. In creation-page flows that explicitly verify WYSIWYG publishing, click `TEXT Editor 작성` before locating `본문 WYSIWYG 편집기`; the generic editor warm-up keeps using the unchanged no-argument WYSIWYG factory.

- [x] **Step 5: Run focused model and component tests**

Run:

```bash
pnpm --filter admin test:model
pnpm --filter admin exec vitest run src/pages/ReviewFormPage.test.tsx
```

Expected: all model tests and the creation-page component suite pass.

- [x] **Step 6: Run full verification**

Run:

```bash
pnpm --filter admin test
pnpm --filter admin build
pnpm --filter admin exec eslint src/lib/managedContent.ts src/pages/PortfolioFormPage.tsx src/pages/blogData.ts src/pages/noticeData.ts src/pages/reviewData.ts src/pages/ReviewFormPage.test.tsx
rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages
git diff --check
```

Expected: tests, build, lint, and whitespace checks pass; the Figma URL scan returns no matches.

- [x] **Step 7: Prepare the scoped change for review**

Run:

```bash
git diff -- apps/admin/src/lib/managedContent.ts apps/admin/src/pages/PortfolioFormPage.tsx apps/admin/src/pages/blogData.ts apps/admin/src/pages/noticeData.ts apps/admin/src/pages/reviewData.ts apps/admin/tests/managedContent.test.mjs apps/admin/tests/adminContentEditorIntegration.test.mjs apps/admin/src/pages/ReviewFormPage.test.tsx apps/admin/tests/blogData.test.mjs apps/admin/tests/noticeData.test.mjs apps/admin/tests/reviewData.test.mjs docs/superpowers/plans/2026-08-19-admin-html-authoring-default.md
```

Expected: the diff contains only the shared initial-mode change, test-fixture adjustments, regression coverage, and this plan. Leave the changes uncommitted until the user explicitly requests a commit.
