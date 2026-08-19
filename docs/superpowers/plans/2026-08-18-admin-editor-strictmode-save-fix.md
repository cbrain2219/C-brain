# Admin Editor StrictMode Save Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 신규 인터뷰·후기 화면에서 WYSIWYG 본문을 입력해도 폼 상태가 비어 있어 저장이 거절되는 StrictMode 런타임 경쟁 조건을 공용 에디터에서 수정하고, 의미상 빈 문서의 가짜 `<p></p>` 초기 HTML을 제거한 뒤 모든 관리자 콘텐츠 화면의 저장 계약을 회귀 테스트로 고정한다.

**Architecture:** `ReviewFormPage`에 우회 상태나 DOM 읽기를 추가하지 않는다. StrictMode에서 Tiptap 인스턴스가 두 번 생성되더라도 첫 번째 정상 `onCreate`가 선택한 활성 editor 참조를 중복 `onCreate`가 덮어쓰지 못하게 한다. 실제 unmount 또는 `documentKey` 교체는 기존처럼 `ImageUploadLifecycle.invalidate()`까지 도달하게 하고, 공용 canonical 변환은 의미상 빈 Tiptap 문서의 HTML을 `''`로 정규화하되 내부 빈 JSON 문서는 유지한다. 검증은 공용 에디터 상태 동기화, 신규 인터뷰·후기 mutation payload, 전체 공유 화면 순서로 계층화한다.

**Tech Stack:** React 19 StrictMode, Vite 8, TypeScript, Tiptap 3.27.1, React Router, Vitest/jsdom, Testing Library, Node test runner.

**Spec:** `docs/superpowers/plans/2026-08-14-admin-text-editor-wysiwyg.md`

## Global Constraints

- Apply the shared editor to Blog, Notice, Portfolio, Interview, and Testimonial content fields; do not create separate editor implementations per page.
- WYSIWYG rows always persist `content_mode = 'html'`, canonical `content_json`, generated HTML in `content`, schema version `1`, and one immutable UUID asset scope.
- Never silently parse or overwrite existing raw HTML/Markdown when modes change. Retain the inactive source/document so switching modes cannot destroy authored work.
- Draft behavior must preserve current domain rules. Publication additionally requires all WYSIWYG uploads to be complete and every image to have reviewed accessibility metadata.
- Follow `design.md`: Pretendard GOV typography, parent `gap` spacing, SVG/currentColor icons, no child margins for normal layout, and no new focus border/outline/box-shadow styling.
- Preserve every pre-existing dirty-worktree change.
- Do not retain any Figma MCP asset URL in source. The final Figma URL scan must return no matches.
- The database migration must deploy before code that writes the new columns. Do not mutate the connected database while implementing unless the user separately authorizes migration execution.
- Keep `<StrictMode>` in `apps/admin/src/main.tsx`; disabling development lifecycle checks is not an accepted fix.
- Keep `runtime.invalidated`, generation checks, and A→B→A stale-callback guards. The fix changes which Tiptap editor instance may claim the live runtime, not whether stale work is rejected.
- Add no dependency, schema change, route change, visual redesign, or page-specific editor implementation in this patch.

---

## Confirmed Failure Chain

1. The administrator first visits another editor page, so `LazyAdminRichTextEditor` is already resolved.
2. A new Interview/Review page mounts the cached editor under `React.StrictMode`.
3. The first `onCreate` marks the runtime created and owns the editor instance that remains visible.
4. A duplicate `onCreate` assigns its other editor instance to `runtime.editor` before checking `runtime.created`, overwriting the live identity.
5. Visible typing still comes from the first editor, so `isCurrentRuntime` rejects every `onUpdate` on the editor-identity comparison.
6. The parent retains the empty value and `managedContentIsEmpty(form)` returns `true`; clicking `등록하기` displays `내용을 입력해주세요.` although the editor visibly contains text.

The existing `AdminContentEditor.realEditor.test.tsx` misses this because it does not render the real editor under application-level StrictMode. A diagnostic StrictMode wrapper reproduced the failure for the warmed lazy-editor path.

## File Structure

- Modify `apps/admin/src/components/admin-editor/AdminRichTextEditor.tsx`: reject duplicate `onCreate` before it can overwrite the live editor identity, without weakening stale-runtime checks.
- Modify `apps/admin/src/components/admin-editor/AdminRichTextEditor.test.tsx`: prove StrictMode typing remains live and real unmount still cleans late uploads.
- Modify `apps/admin/src/components/admin-editor/managedEditorDocument.ts`: emit `html: ''` for a semantically empty canonical document instead of `<p></p>`.
- Modify `apps/admin/src/components/admin-editor/AdminContentEditor.realEditor.test.tsx`: deterministically warm the lazy module, then verify parent form state under StrictMode.
- Modify `apps/admin/src/lib/managedContent.ts`: expose one shared semantic-document emptiness predicate used by form validation and canonical HTML generation.
- Modify `apps/admin/tests/managedContent.test.mjs`: lock the empty-document predicate and empty initial HTML contract.
- Create `apps/admin/src/pages/ReviewFormPage.test.tsx`: verify the actual shared editor reaches the `createReview` mutation boundary for both Interview and Testimonial.
- Modify `apps/admin/src/pages/ReviewFormPage.tsx` only for the separately tested P2 behavior: clear the body validation message once canonical content is genuinely nonempty.
- Do not modify `reviewData.ts` or any public page; the P0 root-cause fix remains entirely inside the shared editor runtime.

## Priority Order and Review Gates

| Priority | Review unit | Why it comes first | Merge gate |
| --- | --- | --- | --- |
| P0-1 | Shared runtime and empty-value fix | This is the root cause and affects every page using the editor. | Warm lazy editor + StrictMode typing updates parent state; real unmount still invalidates and cleans uploads; empty canonical HTML stays `''`. |
| P0-2 | New Interview/Testimonial save boundary | This is the user-reported surface and proves the mutation receives the body rather than only proving component-local state. | `createReview` is called once with canonical HTML/JSON for each type; empty content is still rejected. |
| P1 | Cross-surface regression and build gates | Blog, Notice, Portfolio, and Review share the same runtime and can fail through the same path. | All four entity tests pass in cold and warm lazy-load paths; full admin test/lint/build pass. |
| P2 | Corrected validation-message UX | The red message should disappear after valid content is entered, without hiding other save failures. | `design.md` read; clear only the body-validation error when canonical content becomes nonempty, and keep it for whitespace-only input. |

---

### Task 1 (P0-1): Keep the Shared Editor Runtime Live Through StrictMode Replay

**Files:**

- Modify: `apps/admin/src/components/admin-editor/AdminContentEditor.realEditor.test.tsx`
- Modify: `apps/admin/src/components/admin-editor/AdminRichTextEditor.test.tsx`
- Modify: `apps/admin/src/components/admin-editor/AdminRichTextEditor.tsx:231-242`
- Modify: `apps/admin/src/components/admin-editor/managedEditorDocument.ts:82-96`
- Modify: `apps/admin/src/lib/managedContent.ts:124-182`
- Modify: `apps/admin/tests/managedContent.test.mjs`

**Interfaces:**

- Consumes: `AdminContentEditorProps.onChange(value: ManagedContentFormValue): void`.
- Consumes: Tiptap `onCreate({ editor }): void` callbacks, which may arrive from two StrictMode-created editor instances.
- Produces: first-successful-editor ownership; once `runtime.created` is true, later `onCreate` callbacks cannot mutate `runtime.editor`.
- Produces: `managedContentDocumentIsEmpty(document: unknown): boolean` as the one semantic empty-document predicate.
- Preserves: `isCurrentRuntime(targetRuntime, currentEditor): boolean`, including the `active`, `invalidated`, editor-identity, and destroyed-editor checks.
- Preserves: one canonical `onCreate` followed by canonical `onChange` events only when the JSON/HTML fingerprint changes.

- [ ] **Step 1: Make the real-editor regression deterministic**

Refactor the small test harness in `AdminContentEditor.realEditor.test.tsx` so the same module-level `LazyAdminRichTextEditor` is mounted once, unmounted, and then mounted for the assertion under StrictMode. Put `review` first because it is the reported surface.

```tsx
import { StrictMode, useState } from 'react'

function RealEditorHarness({
  documentKey,
  entity,
}: {
  readonly documentKey: string
  readonly entity: ContentEntity
}) {
  const [value, setValue] = useState<ManagedContentFormValue>(
    createInitialManagedContentValue,
  )

  return (
    <>
      <output aria-label={`${documentKey} publish emptiness`}>
        {String(managedContentIsEmpty(value))}
      </output>
      <AdminContentEditor
        documentKey={documentKey}
        entity={entity}
        onBusyChange={vi.fn()}
        onChange={setValue}
        onPendingAssetCountChange={vi.fn()}
        value={value}
      />
    </>
  )
}

async function warmLazyRichTextEditor() {
  const warmup = render(
    <RealEditorHarness documentKey="warm-editor" entity="review" />,
  )
  await warmup.findByRole('textbox', { name: '본문 WYSIWYG 편집기' })
  warmup.unmount()
}

it('writes review content into form state when the lazy editor is warm in StrictMode', async () => {
  await warmLazyRichTextEditor()
  const view = render(
    <StrictMode>
      <RealEditorHarness documentKey="review:strict-warm" entity="review" />
    </StrictMode>,
  )
  const editor = await view.findByRole('textbox', {
    name: '본문 WYSIWYG 편집기',
  })

  await userEvent.setup().type(editor, '저장할 인터뷰 본문')

  await waitFor(() => {
    expect(
      view.getByLabelText('review:strict-warm publish emptiness').textContent,
    ).toBe('false')
  })
})
```

- [ ] **Step 2: Run the regression and record the red result**

Run:

```bash
pnpm --dir apps/admin exec vitest run src/components/admin-editor/AdminContentEditor.realEditor.test.tsx
```

Expected before the fix: FAIL because `review:strict-warm publish emptiness` remains `true` after the editor DOM receives text.

- [ ] **Step 3: Add the direct StrictMode callback contract**

Add this focused case to `AdminRichTextEditor.test.tsx`. It protects the lower-level invariant even if the lazy shell is refactored later.

```tsx
it('keeps canonical updates live after StrictMode replays the mounted runtime', async () => {
  const onChange = vi.fn()
  const props = editorProps({ onChange })
  const user = userEvent.setup()

  render(
    <StrictMode>
      <AdminRichTextEditor {...props} />
    </StrictMode>,
  )
  const editor = await screen.findByRole('textbox', {
    name: '본문 WYSIWYG 편집기',
  })
  await waitFor(() => expect(props.onCreate).toHaveBeenCalledTimes(1))

  await user.type(editor, 'StrictMode 저장 본문')

  await waitFor(() => expect(onChange).toHaveBeenCalled())
  expect(onChange).toHaveBeenLastCalledWith({
    document: {
      content: [
        {
          attrs: { textAlign: null },
          content: [{ text: 'StrictMode 저장 본문', type: 'text' }],
          type: 'paragraph',
        },
      ],
      type: 'doc',
    },
    html: '<p>StrictMode 저장 본문</p>',
  })
  const emittedValues = onChange.mock.calls.map(([value]) => JSON.stringify(value))
  expect(new Set(emittedValues).size).toBe(emittedValues.length)
  expect(props.onCreate).toHaveBeenCalledTimes(1)
})
```

- [ ] **Step 4: Prevent duplicate `onCreate` from replacing the live editor**

Move the existing `runtime.created` and invalid-editor guard before the assignment to `runtime.editor`. The first valid callback claims the runtime; a second StrictMode callback returns without mutating the claimed identity.

```ts
onCreate: ({ editor: currentEditor }) => {
  if (runtime.created || invalidEditorsRef.current.has(currentEditor)) return
  runtime.editor = currentEditor
  if (!isCurrentRuntime(runtime, currentEditor)) return
  if (hasTransientImageState(currentEditor)) {
    reportContentError(
      currentEditor,
      new Error('Stored editor content contains a pending image.'),
    )
    return
  }
  runtime.created = true
  const value = canonicalValue(currentEditor, runtime.isAllowedImageUrl)
  runtime.lastCleanFingerprint = canonicalFingerprint(value)
  callbacksRef.current.onCreate(value)
},
```

Do not remove the editor-identity comparison from `isCurrentRuntime`. It remains the guard that rejects stale callbacks after a real editor replacement.

- [ ] **Step 5: Prove real unmount still invalidates late upload work**

Add an unmount case beside the existing A→B late-upload test in `AdminRichTextEditor.test.tsx`.

```tsx
it('cleans an upload that resolves after the editor really unmounts', async () => {
  const createObjectUrl = vi
    .spyOn(URL, 'createObjectURL')
    .mockReturnValue('blob:unmounted-preview')
  const revokeObjectUrl = vi
    .spyOn(URL, 'revokeObjectURL')
    .mockImplementation(() => undefined)
  const pendingUpload = deferred<{ alt: string; path: string; url: string }>()
  const props = editorProps({ uploadImage: vi.fn(() => pendingUpload.promise) })
  const view = render(
    <StrictMode>
      <AdminRichTextEditor {...props} />
    </StrictMode>,
  )

  await waitFor(() => expect(props.onCreate).toHaveBeenCalledTimes(1))
  fireEvent.change(screen.getByLabelText('본문 이미지 파일 선택'), {
    target: { files: [new File(['image'], 'late.png', { type: 'image/png' })] },
  })
  await waitFor(() => expect(props.uploadImage).toHaveBeenCalledTimes(1))
  view.unmount()

  const uploaded = {
    alt: 'late',
    path: 'content/blog/scope/images/late.png',
    url: imageUrl,
  }
  pendingUpload.resolve(uploaded)

  await waitFor(() => {
    expect(props.cleanupOrphanedImage).toHaveBeenCalledWith(
      uploaded,
      'editor_replaced',
    )
  })
  expect(revokeObjectUrl).toHaveBeenCalledWith('blob:unmounted-preview')
  createObjectUrl.mockRestore()
  revokeObjectUrl.mockRestore()
})
```

- [ ] **Step 6: Remove the synthetic `<p></p>` initial HTML value**

Export one predicate from `managedContent.ts`, reuse it in `managedContentIsEmpty`, and call it from `canonicalValue` after reading the editor JSON.

```ts
export function managedContentDocumentIsEmpty(document: unknown): boolean {
  return !isTiptapDocument(document) || !documentHasVisibleContent(document)
}

export function managedContentIsEmpty(
  form: Pick<ManagedContentFormValue, 'content' | 'contentAuthoringMode' | 'contentJson' | 'contentMode'>,
): boolean {
  if (form.contentAuthoringMode === 'raw_html' || form.contentMode === 'markdown') {
    return form.content.trim().length === 0
  }

  return managedContentDocumentIsEmpty(form.contentJson)
}
```

```ts
const document = editor.getJSON() as TiptapDocument
const value = {
  document,
  html: managedContentDocumentIsEmpty(document) ? '' : editor.getHTML(),
}
```

Update the empty-editor assertion in `AdminRichTextEditor.test.tsx` from `<p></p>` to `''`. Add a model test asserting `createInitialManagedContentValue().content === ''`, `managedContentDocumentIsEmpty(EMPTY_TIPTAP_DOCUMENT) === true`, and horizontal rules/images remain non-empty.

- [ ] **Step 7: Run the P0-1 focused suite**

Run:

```bash
pnpm --dir apps/admin exec vitest run \
  src/components/admin-editor/AdminContentEditor.realEditor.test.tsx \
  src/components/admin-editor/AdminRichTextEditor.test.tsx \
  src/components/admin-editor/editorImageUploadLifecycle.test.ts
node --experimental-strip-types --test apps/admin/tests/managedContent.test.mjs
```

Expected: PASS. The warmed StrictMode test changes publish emptiness to `false`; `onCreate` remains exactly once; real unmount and document replacement clean late uploads.

- [ ] **Step 8: Review the P0-1 diff before committing**

Run:

```bash
git diff --check
git diff -- \
  apps/admin/src/components/admin-editor/AdminRichTextEditor.tsx \
  apps/admin/src/components/admin-editor/AdminRichTextEditor.test.tsx \
  apps/admin/src/components/admin-editor/AdminContentEditor.realEditor.test.tsx \
  apps/admin/src/components/admin-editor/managedEditorDocument.ts \
  apps/admin/src/lib/managedContent.ts \
  apps/admin/tests/managedContent.test.mjs
```

Reject the diff if it removes StrictMode, weakens `isCurrentRuntime`, reads editor DOM into form state, adds a `ReviewFormPage` workaround, lets a duplicate `onCreate` replace the claimed editor identity, or causes duplicate canonical callbacks.

- [ ] **Step 9: Commit the root fix as one review unit**

```bash
git add \
  apps/admin/src/components/admin-editor/AdminRichTextEditor.tsx \
  apps/admin/src/components/admin-editor/AdminRichTextEditor.test.tsx \
  apps/admin/src/components/admin-editor/AdminContentEditor.realEditor.test.tsx \
  apps/admin/src/components/admin-editor/managedEditorDocument.ts \
  apps/admin/src/lib/managedContent.ts \
  apps/admin/tests/managedContent.test.mjs
git commit -m "fix(admin): keep editor state live in strict mode"
```

---

### Task 2 (P0-2): Prove New Interview and Testimonial Save Payloads

**Files:**

- Create: `apps/admin/src/pages/ReviewFormPage.test.tsx`
- Inspect without changing: `apps/admin/src/pages/ReviewFormPage.tsx:665-1050`
- Inspect without changing: `apps/admin/src/pages/reviewData.ts:95-185`

**Interfaces:**

- Consumes: `ReviewFormPage()` at routes `/reviews/new` and `/reviews/:reviewId`.
- Consumes: `createReview(supabase, input: ReviewMutationInput): Promise<void>`.
- Consumes: the real `AdminContentEditor`; do not mock the editor or its canonical conversion in this acceptance test.
- Produces: an acceptance contract that published Interview and Testimonial bodies reach `createReview` as canonical HTML plus Tiptap JSON.

- [ ] **Step 1: Add deterministic browser and persistence mocks**

Create `ReviewFormPage.test.tsx` with hoisted mocks. Preserve the real YouTube helpers from `@repo/supabase` and mock only persistence calls.

```tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode, useState } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ContentEntity } from '@repo/content/types'
import { AdminContentEditor } from '../components/admin-editor/AdminContentEditor'
import {
  createInitialManagedContentValue,
  type ManagedContentFormValue,
} from '../lib/managedContent'
import { ReviewFormPage } from './ReviewFormPage'

const mocks = vi.hoisted(() => ({
  createReview: vi.fn(),
  supabase: {},
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}))

vi.mock('@repo/supabase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@repo/supabase')>()
  return { ...actual, createReview: mocks.createReview }
})
vi.mock('../lib/supabase', () => ({ supabase: mocks.supabase }))
vi.mock('sonner', () => ({
  toast: { error: mocks.toastError, success: mocks.toastSuccess },
}))
```

Use these exact per-test resets. The no-op `scrollIntoView` supports the empty-content focus path in jsdom.

```tsx
beforeEach(() => {
  mocks.createReview.mockReset().mockResolvedValue(undefined)
  mocks.toastError.mockReset()
  mocks.toastSuccess.mockReset()
  vi.spyOn(window, 'alert').mockImplementation(() => undefined)
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  })
})

afterEach(() => vi.restoreAllMocks())
```

- [ ] **Step 2: Warm the real lazy editor before mounting the page**

Use a standalone real editor harness; this recreates the user path where another content page loaded the editor before `/reviews/new`.

```tsx
function WarmEditor({ entity }: { readonly entity: ContentEntity }) {
  const [value, setValue] = useState<ManagedContentFormValue>(
    createInitialManagedContentValue,
  )
  return (
    <AdminContentEditor
      documentKey="review-page-warmup"
      entity={entity}
      onBusyChange={vi.fn()}
      onChange={setValue}
      onPendingAssetCountChange={vi.fn()}
      value={value}
    />
  )
}

async function renderNewReviewPage() {
  const warmup = render(<WarmEditor entity="notice" />)
  await warmup.findByRole('textbox', { name: '본문 WYSIWYG 편집기' })
  warmup.unmount()

  return render(
    <StrictMode>
      <MemoryRouter initialEntries={['/reviews/new']}>
        <Routes>
          <Route element={<ReviewFormPage />} path="/reviews/new" />
          <Route element={<p>리뷰 목록</p>} path="/reviews" />
        </Routes>
      </MemoryRouter>
    </StrictMode>,
  )
}
```

- [ ] **Step 3: Add the published Interview success case**

Select `인터뷰`, fill every required field, choose `YouTube 링크`, enter `https://youtu.be/dQw4w9WgXcQ`, type `저장되는 인터뷰 본문` into the real WYSIWYG textbox, and click `등록하기`.

```tsx
type User = ReturnType<typeof userEvent.setup>

async function selectReviewType(user: User, type: '인터뷰' | '후기') {
  await user.click(
    screen.getByRole('combobox', { name: '인터뷰 · 후기 유형' }),
  )
  await user.click(screen.getByRole('option', { name: type }))
}

async function fillPublishedInterview(user: User, body?: string) {
  await selectReviewType(user, '인터뷰')
  await user.type(screen.getByLabelText('인터뷰 제목'), '윙즈윗 고객 인터뷰')
  await user.type(screen.getByLabelText('인터뷰 고객사(의뢰처)'), '윙즈윗 고객사')
  await user.type(screen.getByLabelText('진행 프로젝트(제작물)'), '브랜드 영상')
  await user.type(screen.getByLabelText('프로젝트 결과(활용)'), '온라인 캠페인')
  await user.type(screen.getByLabelText('인터뷰 Slug'), 'wingsweet-interview')
  fireEvent.change(screen.getByLabelText('인터뷰 작성일'), {
    target: { value: '2026-08-18' },
  })
  await user.click(screen.getByRole('button', { name: 'YouTube 링크' }))
  await user.type(
    screen.getByLabelText('YouTube 영상 링크'),
    'https://youtu.be/dQw4w9WgXcQ',
  )
  const editor = await screen.findByRole('textbox', {
    name: '본문 WYSIWYG 편집기',
  })
  if (body) await user.type(editor, body)
}

it('publishes canonical WYSIWYG content for a new Interview', async () => {
  await renderNewReviewPage()
  const user = userEvent.setup()
  await fillPublishedInterview(user, '저장되는 인터뷰 본문')
  await user.click(screen.getByRole('button', { name: '등록하기' }))

  await waitFor(() => expect(mocks.createReview).toHaveBeenCalledTimes(1))
  expect(mocks.createReview).toHaveBeenCalledWith(
    mocks.supabase,
    expect.objectContaining({
      company_name: '윙즈윗 고객사',
      content: '<p>저장되는 인터뷰 본문</p>',
      content_asset_scope: expect.any(String),
      content_authoring_mode: 'wysiwyg',
      content_json: {
        content: [
          {
            attrs: { textAlign: null },
            content: [{ text: '저장되는 인터뷰 본문', type: 'text' }],
            type: 'paragraph',
          },
        ],
        type: 'doc',
      },
      content_mode: 'html',
      content_schema_version: 1,
      kind: 'interview',
      project_deliverable: '브랜드 영상',
      project_usage: '온라인 캠페인',
      slug: 'wingsweet-interview',
      status: 'published',
      title: '윙즈윗 고객 인터뷰',
      video_path: null,
      youtube_video_id: 'dQw4w9WgXcQ',
    }),
  )
  await screen.findByText('리뷰 목록')
})
```

Use the accessible labels already rendered by the page: `인터뷰 · 후기 유형`, `인터뷰 제목`, `인터뷰 고객사(의뢰처)`, `진행 프로젝트(제작물)`, `프로젝트 결과(활용)`, `인터뷰 Slug`, `인터뷰 작성일`, `YouTube 영상 링크`, and `본문 WYSIWYG 편집기`.

- [ ] **Step 4: Add the published Testimonial success case**

Render a fresh page, select `후기`, fill `후기 고객사`, `후기 담당자`, `후기 작성일`, type `저장되는 고객 후기 본문`, and click `등록하기`.

```tsx
async function fillPublishedTestimonial(user: User, body?: string) {
  await selectReviewType(user, '후기')
  await user.type(screen.getByLabelText('후기 고객사'), '윙즈윗 고객사')
  await user.type(screen.getByLabelText('후기 담당자'), '김담당')
  fireEvent.change(screen.getByLabelText('후기 작성일'), {
    target: { value: '2026-08-18' },
  })
  const editor = await screen.findByRole('textbox', {
    name: '본문 WYSIWYG 편집기',
  })
  if (body) await user.type(editor, body)
}

it('publishes canonical WYSIWYG content for a new Testimonial', async () => {
  await renderNewReviewPage()
  const user = userEvent.setup()
  await fillPublishedTestimonial(user, '저장되는 고객 후기 본문')
  await user.click(screen.getByRole('button', { name: '등록하기' }))

  await waitFor(() => expect(mocks.createReview).toHaveBeenCalledTimes(1))
  expect(mocks.createReview).toHaveBeenCalledWith(
    mocks.supabase,
    expect.objectContaining({
      company_name: '윙즈윗 고객사',
      content: '<p>저장되는 고객 후기 본문</p>',
      content_authoring_mode: 'wysiwyg',
      content_json: expect.objectContaining({ type: 'doc' }),
      content_mode: 'html',
      content_schema_version: 1,
      kind: 'testimonial',
      manager_name: '김담당',
      project_deliverable: null,
      project_usage: null,
      show_on_landing: true,
      status: 'published',
      title: null,
      video_path: null,
      youtube_video_id: null,
    }),
  )
})
```

- [ ] **Step 5: Keep semantic-empty validation as a negative contract**

For both `인터뷰` and `후기`, fill the other publish-required fields but leave the real editor untouched. Click `등록하기` and assert:

```tsx
it.each([
  ['인터뷰', fillPublishedInterview],
  ['후기', fillPublishedTestimonial],
] as const)('rejects a semantically empty %s body', async (_type, fillForm) => {
  await renderNewReviewPage()
  const user = userEvent.setup()
  await fillForm(user)
  await user.click(screen.getByRole('button', { name: '등록하기' }))

  await waitFor(() => {
    expect(screen.getByRole('alert').textContent).toBe('내용을 입력해주세요.')
  })
  expect(mocks.createReview).not.toHaveBeenCalled()
})
```

This prevents the runtime fix from weakening the genuine empty-body guard.

- [ ] **Step 6: Run and review the Review page acceptance suite**

Run:

```bash
pnpm --dir apps/admin exec vitest run src/pages/ReviewFormPage.test.tsx
git diff --check
git diff -- apps/admin/src/pages/ReviewFormPage.test.tsx
```

Expected: four cases pass—Interview success, Testimonial success, Interview empty rejection, and Testimonial empty rejection. The production page and mapper remain unchanged.

- [ ] **Step 7: Commit the user-reported surface contract**

```bash
git add apps/admin/src/pages/ReviewFormPage.test.tsx
git commit -m "test(admin): cover review editor save payloads"
```

---

### Task 3 (P1): Extend the Regression to Every Shared Editor Surface

**Files:**

- Modify: `apps/admin/src/components/admin-editor/AdminContentEditor.realEditor.test.tsx`
- Verify without changing unless a test fails: `apps/admin/src/components/admin-editor/AdminContentEditor.test.tsx`
- Verify without changing unless a test fails: `apps/admin/src/components/admin-editor/editorImageUploadLifecycle.test.ts`
- Verify without changing unless a test fails: `apps/admin/tests/adminContentEditorIntegration.test.mjs`
- Verify without changing unless a test fails: `apps/admin/tests/reviewFormPage.test.mjs`
- Verify without changing unless a test fails: `apps/admin/tests/reviewData.test.mjs`

**Interfaces:**

- Consumes: `ContentEntity = 'blog' | 'notice' | 'portfolio' | 'review'`.
- Produces: one deterministic warm-StrictMode form-state matrix covering every `ContentEntity`.
- Preserves: raw/WYSIWYG switching, Korean composition, generation guards, pending-upload locks, schema failure behavior, and canonical mutation mapping.

- [ ] **Step 1: Put cold and warm assertions in one deterministic test**

Replace the Task 1 review-only test and its `warmLazyRichTextEditor` helper with one test that performs the cold assertion first and then the review-first warm matrix. This makes the module-level `LazyAdminRichTextEditor` state local to one explicit sequence and avoids resetting React modules.

```tsx
async function expectTypedContentReachesForm(input: {
  readonly body: string
  readonly documentKey: string
  readonly entity: ContentEntity
}) {
  const view = render(
    <StrictMode>
      <RealEditorHarness
        documentKey={input.documentKey}
        entity={input.entity}
      />
    </StrictMode>,
  )
  const editor = await view.findByRole('textbox', {
    name: '본문 WYSIWYG 편집기',
  })
  await userEvent.setup().type(editor, input.body)
  await waitFor(() => {
    expect(
      view.getByLabelText(
        `${input.documentKey} publish emptiness`,
      ).textContent,
    ).toBe('false')
  })
  view.unmount()
}

it('writes cold and warm StrictMode editor content into every parent form', async () => {
  await expectTypedContentReachesForm({
    body: '콜드 로드 공지 본문',
    documentKey: 'notice:strict-cold',
    entity: 'notice',
  })

  for (const [entity, body] of [
    ['review', '저장할 인터뷰 · 후기 본문'],
    ['portfolio', '저장할 포트폴리오 본문'],
    ['blog', '저장할 블로그 본문'],
    ['notice', '저장할 공지 본문'],
  ] as const) {
    await expectTypedContentReachesForm({
      body,
      documentKey: `${entity}:strict-warm`,
      entity,
    })
  }
})
```

- [ ] **Step 2: Confirm both lazy-load paths are represented**

Run only the real-editor file with the verbose reporter and verify its single integration test reports one pass after executing all five render cycles:

```bash
pnpm --dir apps/admin exec vitest run \
  src/components/admin-editor/AdminContentEditor.realEditor.test.tsx \
  --reporter=verbose
```

Expected: the first render crosses the Suspense cold-load boundary; the next four renders reuse the resolved lazy component under StrictMode.

- [ ] **Step 3: Run all shared editor behavioral suites**

Run:

```bash
pnpm --dir apps/admin exec vitest run \
  src/components/admin-editor/AdminContentEditor.realEditor.test.tsx \
  src/components/admin-editor/AdminRichTextEditor.test.tsx \
  src/components/admin-editor/AdminContentEditor.test.tsx \
  src/components/admin-editor/editorImageUploadLifecycle.test.ts \
  src/pages/ReviewFormPage.test.tsx
```

Expected: PASS for all entity, StrictMode, mode-switch, Korean IME, sibling-rerender, A→B→A, pending-upload, and late-cleanup contracts.

- [ ] **Step 4: Run static form and mapper integration tests**

Run:

```bash
node --experimental-strip-types --test \
  apps/admin/tests/adminContentEditorIntegration.test.mjs \
  apps/admin/tests/reviewFormPage.test.mjs \
  apps/admin/tests/reviewData.test.mjs
```

Expected: PASS. The four form pages still use one `AdminContentEditor`, and review mutations retain the canonical managed-content columns.

- [ ] **Step 5: Run full admin quality gates**

Run in this order so test failures are easier to classify:

```bash
pnpm --dir apps/admin test
pnpm --dir apps/admin lint
pnpm --dir apps/admin build
git diff --check
```

Expected: every command exits `0`.

- [ ] **Step 6: Run the repository asset-policy scan**

Run:

```bash
rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages
```

Expected: no matches.

- [ ] **Step 7: Perform local manual QA in the reported order**

Use a non-production local environment and the existing authenticated admin session.

1. Visit `/notices/new` and wait for the WYSIWYG editor so the lazy chunk is warm.
2. Navigate to `/reviews/new` without reloading the app.
3. Select `인터뷰`, fill all required fields, use a valid YouTube URL, type an H3 plus Korean paragraph, click `등록하기`, and verify the list navigation occurs without `내용을 입력해주세요.`.
4. Open the saved Interview and confirm the WYSIWYG body reloads as the same heading and paragraph.
5. Return to `/reviews/new`, select `후기`, fill all required fields, type Korean body text, publish, and confirm the saved body reloads.
6. Leave one new Review body empty and confirm publication is still rejected with `내용을 입력해주세요.`.
7. Smoke-test one typed publish or draft on `/portfolios/new`, `/blogs/new`, and `/notices/new` after the Review flow passes.

- [ ] **Step 8: Review and commit the cross-surface test expansion**

Run:

```bash
git diff --stat
git status --short
```

The expected production diff remains limited to `AdminRichTextEditor.tsx`, `managedEditorDocument.ts`, and `managedContent.ts`; the remaining changes are regression tests and this plan. Commit the P1 test expansion:

```bash
git add apps/admin/src/components/admin-editor/AdminContentEditor.realEditor.test.tsx
git commit -m "test(admin): verify managed editor surfaces in strict mode"
```

---

## P2: Clear a Corrected Content Validation Message

This remains independent of the root-cause fix. `ReviewFormPage` previously cleared `saveError` only at the start of `persist()`, so an earlier `내용을 입력해주세요.` message could remain visible while the administrator corrected the body before the next submit. The user approved including this follow-up in the working branch.

1. [x] Read `design.md` before changing form behavior.
2. [x] Add a page test that submits an empty body, observes `내용을 입력해주세요.`, keeps it for whitespace-only input, then types valid canonical content and expects the message to disappear.
3. [x] Wrap `onManagedContentChange` in `ReviewFormPage.tsx` so it merges the canonical value and clears only the current content-validation message when content becomes nonempty. Unrelated persistence, permission, upload, and deletion errors remain untouched.
4. [x] Keep this UX adjustment scoped to Interview/Testimonial; Blog, Notice, and Portfolio require their own equivalent tests before adopting it.

## Final Code Review Checklist

- [ ] The fix is in `AdminRichTextEditor`, not duplicated across form pages.
- [ ] `apps/admin/src/main.tsx` still renders the app under `<StrictMode>`.
- [ ] The warmed lazy-editor path is explicitly tested and does not depend on test order.
- [ ] A duplicate StrictMode `onCreate` cannot replace the editor identity already claimed by the live runtime.
- [ ] A different `documentKey` and a real unmount still invalidate the detached runtime.
- [ ] Late uploaded images are cleaned with reason `editor_replaced`; object URLs are revoked once.
- [ ] `onCreate` fires exactly once and typing emits canonical JSON and generated HTML without duplicate fingerprints.
- [ ] Interview and Testimonial publication each call `createReview` once with non-empty canonical content.
- [ ] A truly empty body remains blocked before mutation.
- [ ] Blog, Notice, Portfolio, and Review all pass the same real-editor StrictMode contract.
- [ ] Full test, lint, build, diff, and Figma URL gates pass.
