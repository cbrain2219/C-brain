# Admin Interview / Review Create/Edit Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Figma-backed `/reviews/new` and `/reviews/:reviewId` form so the empty state shows only the interview/review selector and the selected value reveals the correct create/edit fields.

**Architecture:** Use one route-aware `ReviewFormPage` with a fixed `'' | '인터뷰' | '후기'` discriminator. The empty discriminator reproduces Figma node `332:3027`; `인터뷰` renders node `332:3639`; `후기` renders node `332:3972`. Keep the page state local, reuse the existing admin form shell, combobox, icons, editor styles, and client-side navigation conventions, and isolate the only new domain logic—type narrowing and video validation—in a pure helper with Node tests.

**Tech Stack:** React 19, TypeScript, React Router 7, Vite 8, existing admin CSS variables and Pretendard tokens, Node built-in test runner.

## Global Constraints

- Figma sources: empty selector `332:3027`, interview form `332:3639`, review form `332:3972` in file `qZcNE6of4hWidBcayhacSI`.
- Treat the Chrome mock and footer embedded in those Figma frames as presentation context. Reuse the existing `AdminHeader`/admin shell and do not add browser chrome or a form-specific footer.
- Keep one URL for each operation: `/reviews/new` for creation and `/reviews/:reviewId` for editing. Do not create type-specific URLs or a second wizard route.
- On `/reviews/new`, the initial state renders only the title, fixed type selector, and actions. Selecting `인터뷰` or `후기` reveals its fields inline; clearing the selection collapses the conditional fields.
- Retain controlled values when the operator switches type during the same session: company/date/content stay as shared values, and branch-exclusive values stay in state while hidden. Validate only the active branch; a future persistence payload must omit inactive branch fields.
- Interview fields, in order: type, title, customer company, slug, authored date, one video plus video ALT text, content mode/body, SEO Description.
- Review fields, in order: type, customer company, contact person, authored date, content mode/body, landing setting.
- Use corrected product copy where the Figma source is internally inconsistent: `등록하기` instead of `동륵하기`, `TEXT Editor 작성`, and `후기 내용` / `후기 내용을 입력해주세요.` on the review branch instead of the interview copy present in node `332:3972`.
- Interview slug accepts English letters and hyphens only, matching the Figma placeholder and existing Portfolio/Blog rule. Reuse `isValidPortfolioSlug` through an interview-local helper rather than duplicating the regular expression.
- Video upload is optional because the design has no required marker. If supplied, accept one `.mp4` or `.mov` file (MIME `video/mp4` or `video/quicktime`) up to exactly 500MB; reject all other files before storing them in state.
- Use a native `<input type="date">`; do not add a date-picker package or custom calendar glyph. Use the existing `AdminIcon` registry for chevron, check, folder-up, close, and arrow-right icons; no Figma URL is needed.
- Reuse `AdminFormLayout`, `AdminTypeCombobox`, `AdminIcon`, and the current Blog content-control CSS. Do not introduce a generic form framework, rich-text package, uploader dependency, or type-specific page component.
- Apply `design.md`: Pretendard typography, `-0.015em` tracking, parent `gap` for related spacing, `currentColor` SVG UI icons, and no custom input/select/textarea focus visuals.
- The current admin project has no review table, read/create/update service, or storage endpoint. This plan delivers the same client-only create/edit scaffold as the existing Product, Portfolio, Blog, and Notice forms: valid submit navigates to `/reviews`, edit mode changes page/submit copy, and `임시저장` remains non-mutating until persistence is designed. Do not fabricate rows, API responses, or Supabase schema in this UI task.
- When a persistence layer is later added, hydrate the same `ReviewFormState` from `reviewId`; do not replace the discriminator or split the form into separate pages.
- Preserve unrelated dirty-worktree changes. Stage only the exact new files or modified hunks listed by each task; never use `git add -A`, and use patch staging for already-dirty files.
- Before completion, `rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages` must return no matches.

## File Map

- Create `apps/admin/src/pages/reviewFormState.ts`: fixed type vocabulary, type guard, interview slug adapter, and video validation.
- Create `apps/admin/tests/reviewFormState.test.mjs`: pure boundary tests for type and upload validation.
- Create `apps/admin/src/pages/ReviewFormPage.tsx`: shared create/edit page, fixed selector, conditional branches, controls, and client-only submit behavior.
- Create `apps/admin/src/pages/ReviewFormPage.css`: review-only upload/responsive additions while existing form primitives remain in `BlogFormPage.css` and `AdminFormLayout.css`.
- Create `apps/admin/tests/reviewFormPage.test.mjs`: route, branch, copy, accessibility-hook, and asset-policy regression checks using the repository's source-test convention.
- Modify `apps/admin/src/App.tsx`: import the page and register create/edit routes.
- Modify `apps/admin/src/pages/ReviewPage.tsx`: retain its existing `detailHref` edit-entry contract and correct the copied Blog search placeholder.

---

### Task 1: Lock the discriminator and video validation contract

**Files:**

- Create: `apps/admin/src/pages/reviewFormState.ts`
- Create: `apps/admin/tests/reviewFormState.test.mjs`

**Interfaces:**

- Consumes: `isValidPortfolioSlug(value: string): boolean` from `portfolioFormState.ts`.
- Produces: `reviewTypes`, `ReviewType`, `isReviewType`, `isValidInterviewSlug`, `MAX_REVIEW_VIDEO_BYTES`, and `getReviewVideoError`.

- [ ] **Step 1: Write the failing domain tests.**

Create `apps/admin/tests/reviewFormState.test.mjs`:

```js
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  MAX_REVIEW_VIDEO_BYTES,
  getReviewVideoError,
  isReviewType,
  isValidInterviewSlug,
  reviewTypes,
} from '../src/pages/reviewFormState.ts'

test('review types contain only the two fixed Figma choices', () => {
  assert.deepEqual(reviewTypes, ['인터뷰', '후기'])
  assert.equal(isReviewType('인터뷰'), true)
  assert.equal(isReviewType('후기'), true)
  assert.equal(isReviewType('블로그'), false)
  assert.equal(isReviewType(''), false)
})

test('interview slug follows the existing English letters and hyphens rule', () => {
  assert.equal(isValidInterviewSlug('customer-interview'), true)
  assert.equal(isValidInterviewSlug('CustomerInterview'), true)
  assert.equal(isValidInterviewSlug('customer-01'), false)
  assert.equal(isValidInterviewSlug('고객-인터뷰'), false)
})

test('review video accepts MP4 and MOV files through MIME or empty-MIME extension fallback', () => {
  assert.equal(
    getReviewVideoError({ name: 'interview.mp4', size: 1, type: 'video/mp4' }),
    null,
  )
  assert.equal(
    getReviewVideoError({ name: 'interview.mov', size: 1, type: '' }),
    null,
  )
  assert.equal(
    getReviewVideoError({
      name: 'interview.mov',
      size: MAX_REVIEW_VIDEO_BYTES,
      type: 'video/quicktime',
    }),
    null,
  )
})

test('review video rejects unsupported formats and files over 500MB', () => {
  assert.match(
    getReviewVideoError({ name: 'interview.webm', size: 1, type: 'video/webm' }) ?? '',
    /MP4, MOV/,
  )
  assert.match(
    getReviewVideoError({ name: 'renamed.mp4', size: 1, type: 'application/pdf' }) ?? '',
    /MP4, MOV/,
  )
  assert.match(
    getReviewVideoError({
      name: 'interview.mp4',
      size: MAX_REVIEW_VIDEO_BYTES + 1,
      type: 'video/mp4',
    }) ?? '',
    /500MB/,
  )
})
```

- [ ] **Step 2: Run the focused test and verify the missing-module failure.**

Run:

```bash
node --experimental-strip-types --test apps/admin/tests/reviewFormState.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `reviewFormState.ts`.

- [ ] **Step 3: Add the minimal pure helper implementation.**

Create `apps/admin/src/pages/reviewFormState.ts`:

```ts
import { isValidPortfolioSlug } from './portfolioFormState.ts'

export const reviewTypes = ['인터뷰', '후기'] as const

export type ReviewType = (typeof reviewTypes)[number]

export const MAX_REVIEW_VIDEO_BYTES = 500 * 1024 * 1024

const acceptedVideoTypes = new Set(['video/mp4', 'video/quicktime'])
const acceptedVideoExtension = /\.(mp4|mov)$/i

export type ReviewVideoFile = Pick<File, 'name' | 'size' | 'type'>

export function isReviewType(value: string): value is ReviewType {
  return reviewTypes.some((reviewType) => reviewType === value)
}

export function isValidInterviewSlug(value: string) {
  return isValidPortfolioSlug(value)
}

export function getReviewVideoError(file: ReviewVideoFile) {
  const hasAcceptedType = acceptedVideoTypes.has(file.type)
  const hasAcceptedExtension = file.type === '' && acceptedVideoExtension.test(file.name)

  if (!hasAcceptedType && !hasAcceptedExtension) {
    return 'MP4, MOV 파일만 업로드할 수 있습니다.'
  }

  if (file.size > MAX_REVIEW_VIDEO_BYTES) {
    return '영상 파일은 최대 500MB까지 업로드할 수 있습니다.'
  }

  return null
}
```

- [ ] **Step 4: Re-run the helper tests.**

Run:

```bash
node --experimental-strip-types --test apps/admin/tests/reviewFormState.test.mjs
```

Expected: 4 tests PASS.

- [ ] **Step 5: Commit the validation contract.**

```bash
git add apps/admin/src/pages/reviewFormState.ts apps/admin/tests/reviewFormState.test.mjs
git commit -m "test(admin): add review form validation contract"
```

---

### Task 2: Build the empty, interview, and review states in one form

**Files:**

- Create: `apps/admin/src/pages/ReviewFormPage.tsx`
- Create: `apps/admin/src/pages/ReviewFormPage.css`

**Interfaces:**

- Consumes: `AdminFormLayout`, `AdminTypeCombobox`, `AdminIcon`, Blog form control classes, and all Task 1 exports.
- Produces: `ReviewFormPage`, driven by `/reviews/new` or `/reviews/:reviewId`, with `form.type` as the only visibility discriminator.

- [ ] **Step 1: Define the flat state and small page-local field components.**

Start `apps/admin/src/pages/ReviewFormPage.tsx` with these exact imports, types, state, and reusable text/content controls. A flat state intentionally preserves inactive branch input while `form.type` alone controls visibility and validation.

```tsx
import { useId, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, FormEvent, RefObject } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AdminIcon } from '../components/AdminIcon'
import { AdminFormLayout } from '../components/admin-form/AdminFormLayout'
import { AdminTypeCombobox } from '../components/admin-form/AdminTypeCombobox'
import {
  getReviewVideoError,
  isReviewType,
  isValidInterviewSlug,
  reviewTypes,
} from './reviewFormState'
import type { ReviewType } from './reviewFormState'
import './BlogFormPage.css'
import './ReviewFormPage.css'

type ReviewContentMode = 'html' | 'text'

type ReviewFormState = {
  readonly company: string
  readonly content: string
  readonly contentMode: ReviewContentMode
  readonly isLandingEnabled: boolean
  readonly manager: string
  readonly publishedAt: string
  readonly seoDescription: string
  readonly slug: string
  readonly title: string
  readonly type: ReviewType | ''
  readonly video: File | null
  readonly videoAlt: string
}

const initialReviewForm: ReviewFormState = {
  company: '',
  content: '',
  contentMode: 'html',
  isLandingEnabled: true,
  manager: '',
  publishedAt: '',
  seoDescription: '',
  slug: '',
  title: '',
  type: '',
  video: null,
  videoAlt: '',
}

type TextFieldProps = {
  readonly id: string
  readonly label: string
  readonly name: string
  readonly onChange: (value: string) => void
  readonly placeholder: string
  readonly required?: boolean
  readonly value: string
}

function TextField({
  id,
  label,
  name,
  onChange,
  placeholder,
  required = true,
  value,
}: TextFieldProps) {
  return (
    <label className="blog-form__field" htmlFor={id}>
      <span className="blog-form__label">{label}</span>
      <input
        autoComplete="off"
        className="blog-form__control"
        id={id}
        name={name}
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder={placeholder}
        required={required}
        type="text"
        value={value}
      />
    </label>
  )
}

type ContentFieldProps = {
  readonly content: string
  readonly mode: ReviewContentMode
  readonly onContentChange: (value: string) => void
  readonly onModeChange: (mode: ReviewContentMode) => void
  readonly type: ReviewType
}

function ContentField({
  content,
  mode,
  onContentChange,
  onModeChange,
  type,
}: ContentFieldProps) {
  return (
    <fieldset className="blog-form__content-field">
      <legend className="blog-form__label">{type} 내용</legend>
      <div className="blog-form__mode-tabs">
        {(['html', 'text'] as const).map((contentMode) => (
          <button
            aria-pressed={mode === contentMode}
            className={
              mode === contentMode
                ? 'blog-form__mode-tab blog-form__mode-tab--active'
                : 'blog-form__mode-tab'
            }
            key={contentMode}
            onClick={() => onModeChange(contentMode)}
            type="button"
          >
            {contentMode === 'html' ? 'HTML 작성' : 'TEXT Editor 작성'}
          </button>
        ))}
      </div>
      <textarea
        className="blog-form__textarea blog-form__textarea--content"
        name="content"
        onChange={(event) => onContentChange(event.currentTarget.value)}
        placeholder={`${type} 내용을 입력해주세요.`}
        required
        value={content}
      />
    </fieldset>
  )
}
```

- [ ] **Step 2: Add the video upload and landing-setting components.**

Append these page-local components in `ReviewFormPage.tsx`. The upload uses a label-backed hidden input, so the whole Figma dropzone is keyboard/click accessible without nesting one button inside another.

```tsx
type VideoFieldProps = {
  readonly errorMessage: string
  readonly inputId: string
  readonly inputRef: RefObject<HTMLInputElement | null>
  readonly onAltChange: (value: string) => void
  readonly onClear: () => void
  readonly onDrop: (event: DragEvent<HTMLLabelElement>) => void
  readonly onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  readonly video: File | null
  readonly videoAlt: string
}

function VideoField({
  errorMessage,
  inputId,
  inputRef,
  onAltChange,
  onClear,
  onDrop,
  onFileChange,
  video,
  videoAlt,
}: VideoFieldProps) {
  const errorId = `${inputId}-error`

  return (
    <fieldset className="blog-form__thumbnail-field">
      <legend className="blog-form__label">인터뷰 영상</legend>
      <div className="blog-form__thumbnail-header">
        <span className="blog-form__thumbnail-label">
          <span className="blog-form__check">
            <AdminIcon name="check" />
          </span>
          <span>영상 추가</span>
        </span>
        <label className="blog-form__thumbnail-alt" htmlFor={`${inputId}-alt`}>
          <span className="blog-form__visually-hidden">영상 대체 텍스트</span>
          <input
            autoComplete="off"
            className="blog-form__alt-input"
            id={`${inputId}-alt`}
            name="videoAlt"
            onChange={(event) => onAltChange(event.currentTarget.value)}
            placeholder="VIDEO ALT TAG를 입력해주세요."
            type="text"
            value={videoAlt}
          />
        </label>
      </div>
      <input
        accept=".mp4,.mov,video/mp4,video/quicktime"
        aria-describedby={errorMessage ? errorId : undefined}
        aria-invalid={errorMessage ? true : undefined}
        className="blog-form__visually-hidden"
        id={inputId}
        onChange={onFileChange}
        ref={inputRef}
        type="file"
      />
      <div className="blog-form__thumbnail-preview-wrap">
        <label
          className="blog-form__dropzone"
          htmlFor={inputId}
          onDragOver={(event) => event.preventDefault()}
          onDrop={onDrop}
        >
          <span className="blog-form__folder-icon">
            <AdminIcon name="folder-up" size={20} />
          </span>
          <span className="blog-form__dropzone-copy">
            <span>파일을 드래그 또는 클릭 후 파일 업로드 ({video ? '1/1' : '0/1'})</span>
            <span>MP4, MOV 등 / 최대 500MB 제한</span>
          </span>
        </label>
        {video ? (
          <button
            aria-label={`${video.name} 삭제`}
            className="blog-form__thumbnail-chip"
            onClick={onClear}
            type="button"
          >
            <span className="blog-form__thumbnail-file-name" title={video.name}>
              {video.name}
            </span>
            <AdminIcon name="x-close" size={20} />
          </button>
        ) : null}
      </div>
      {errorMessage ? (
        <span className="blog-form__error" id={errorId} role="alert">
          {errorMessage}
        </span>
      ) : null}
    </fieldset>
  )
}

type LandingSettingProps = {
  readonly checked: boolean
  readonly onChange: (checked: boolean) => void
}

function LandingSetting({ checked, onChange }: LandingSettingProps) {
  return (
    <label className="blog-form-setting">
      <input
        checked={checked}
        className="blog-form__visually-hidden"
        name="isLandingEnabled"
        onChange={(event) => onChange(event.currentTarget.checked)}
        type="checkbox"
      />
      <span className="blog-form-setting__content">
        <span className="blog-form-setting__label">
          <span
            className={
              checked
                ? 'blog-form-setting__check blog-form-setting__check--checked'
                : 'blog-form-setting__check'
            }
          >
            <AdminIcon name="check" />
          </span>
          <span>랜딩 설정</span>
        </span>
        <span className="blog-form-setting__count">3개 등록됨</span>
      </span>
    </label>
  )
}
```

- [ ] **Step 3: Implement route mode, fixed-type selection, validation, and actions.**

Append the component body in `ReviewFormPage.tsx`. Keep `setVideo` separate so both file-input and drop paths share identical validation.

```tsx
export function ReviewFormPage() {
  const formId = useId().replaceAll(':', '')
  const videoInput = useRef<HTMLInputElement | null>(null)
  const navigate = useNavigate()
  const { reviewId } = useParams<{ reviewId: string }>()
  const isEditing = reviewId !== undefined
  const [form, setForm] = useState<ReviewFormState>(initialReviewForm)
  const [slugError, setSlugError] = useState('')
  const [typeError, setTypeError] = useState('')
  const [videoError, setVideoError] = useState('')

  const pageTitle = isEditing
    ? `${form.type || '인터뷰 · 후기'} 수정`
    : '신규 인터뷰 · 후기 등록'
  const submitLabel = isEditing ? '수정하기' : '등록하기'

  function updateForm<Key extends keyof ReviewFormState>(
    key: Key,
    value: ReviewFormState[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function setVideo(file: File | undefined) {
    if (!file) return

    const errorMessage = getReviewVideoError(file)

    if (errorMessage) {
      setVideoError(errorMessage)
      return
    }

    updateForm('video', file)
    setVideoError('')
  }

  function clearVideo() {
    updateForm('video', null)
    setVideoError('')
    if (videoInput.current) videoInput.current.value = ''
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.type) {
      setTypeError('인터뷰 · 후기 유형을 선택해주세요.')
      window.requestAnimationFrame(() => {
        document.getElementById(`${formId}-type`)?.focus()
      })
      return
    }

    if (form.type === '인터뷰' && !isValidInterviewSlug(form.slug)) {
      setSlugError('Slug는 영문과 하이픈만 입력할 수 있습니다.')
      window.requestAnimationFrame(() => {
        document.getElementById(`${formId}-slug`)?.focus()
      })
      return
    }

    setSlugError('')
    navigate('/reviews')
  }

  const actions = (
    <>
      <Link className="admin-form__button admin-form__button--outline" to="/reviews">
        목록으로
      </Link>
      <div className="admin-form__actions-group">
        <button className="admin-form__button admin-form__button--outline" type="button">
          임시저장
        </button>
        <button className="admin-form__button admin-form__button--solid" type="submit">
          <span>{submitLabel}</span>
          <AdminIcon name="arrow-right" />
        </button>
      </div>
    </>
  )

  return (
    <AdminFormLayout actions={actions} onSubmit={handleSubmit} title={pageTitle}>
      <label className="blog-form__field" htmlFor={`${formId}-type`}>
        <span className="blog-form__label">인터뷰 · 후기 유형</span>
        <AdminTypeCombobox
          errorMessage={typeError}
          inputId={`${formId}-type`}
          name="type"
          onClear={() => {
            updateForm('type', '')
            setTypeError('')
          }}
          onCommit={(value) => {
            if (!isReviewType(value)) return
            updateForm('type', value)
            setTypeError('')
          }}
          options={reviewTypes}
          placeholder="인터뷰 · 후기 유형을 선택해주세요."
          value={form.type}
        />
        {typeError ? (
          <span className="blog-form__error" id={`${formId}-type-error`} role="alert">
            {typeError}
          </span>
        ) : null}
      </label>

      {form.type === '인터뷰' ? (
        <InterviewFields
          form={form}
          formId={formId}
          onFileChange={(event) => setVideo(event.currentTarget.files?.[0])}
          onFileDrop={(event) => {
            event.preventDefault()
            setVideo(event.dataTransfer.files[0])
          }}
          onSlugErrorChange={setSlugError}
          onUpdate={updateForm}
          onVideoClear={clearVideo}
          slugError={slugError}
          videoError={videoError}
          videoInput={videoInput}
        />
      ) : null}

      {form.type === '후기' ? (
        <ReviewFields form={form} formId={formId} onUpdate={updateForm} />
      ) : null}
    </AdminFormLayout>
  )
}
```

- [ ] **Step 4: Add the exact interview and review branches before `ReviewFormPage`.**

Insert these branch components before the exported page. Each branch owns only the fields visible in its Figma state; the parent owns state and submit behavior.

```tsx
type UpdateReviewForm = <Key extends keyof ReviewFormState>(
  key: Key,
  value: ReviewFormState[Key],
) => void

type InterviewFieldsProps = {
  readonly form: ReviewFormState
  readonly formId: string
  readonly onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  readonly onFileDrop: (event: DragEvent<HTMLLabelElement>) => void
  readonly onSlugErrorChange: (message: string) => void
  readonly onUpdate: UpdateReviewForm
  readonly onVideoClear: () => void
  readonly slugError: string
  readonly videoError: string
  readonly videoInput: RefObject<HTMLInputElement | null>
}

function InterviewFields({
  form,
  formId,
  onFileChange,
  onFileDrop,
  onSlugErrorChange,
  onUpdate,
  onVideoClear,
  slugError,
  videoError,
  videoInput,
}: InterviewFieldsProps) {
  return (
    <>
      <TextField
        id={`${formId}-title`}
        label="인터뷰 제목"
        name="title"
        onChange={(value) => onUpdate('title', value)}
        placeholder="인터뷰 제목을 입력해주세요."
        value={form.title}
      />
      <TextField
        id={`${formId}-company`}
        label="인터뷰 고객사"
        name="company"
        onChange={(value) => onUpdate('company', value)}
        placeholder="인터뷰 고객사를 입력해주세요."
        value={form.company}
      />
      <label className="blog-form__field" htmlFor={`${formId}-slug`}>
        <span className="blog-form__label">인터뷰 Slug</span>
        <input
          aria-describedby={slugError ? `${formId}-slug-error` : undefined}
          aria-invalid={slugError ? true : undefined}
          autoComplete="off"
          className="blog-form__control"
          id={`${formId}-slug`}
          name="slug"
          onChange={(event) => {
            const rawValue = event.currentTarget.value
            const slug = rawValue.replace(/[^A-Za-z-]/g, '')
            onUpdate('slug', slug)
            onSlugErrorChange(
              rawValue === slug ? '' : '영어와 하이픈만 입력해주세요.',
            )
          }}
          onInvalid={() =>
            onSlugErrorChange('Slug는 영문과 하이픈만 입력할 수 있습니다.')
          }
          pattern="[A-Za-z-]+"
          placeholder="인터뷰 Slug를 입력해주세요. (영문만 작성)"
          required
          type="text"
          value={form.slug}
        />
        {slugError ? (
          <span className="blog-form__error" id={`${formId}-slug-error`} role="alert">
            {slugError}
          </span>
        ) : null}
      </label>
      <label className="blog-form__field" htmlFor={`${formId}-published-at`}>
        <span className="blog-form__label">인터뷰 작성일</span>
        <input
          className="blog-form__control blog-form__control--date"
          id={`${formId}-published-at`}
          name="publishedAt"
          onChange={(event) => onUpdate('publishedAt', event.currentTarget.value)}
          onPointerDown={(event) => {
            if (!event.currentTarget.showPicker) return
            event.preventDefault()
            event.currentTarget.showPicker()
          }}
          required
          type="date"
          value={form.publishedAt}
        />
      </label>
      <VideoField
        errorMessage={videoError}
        inputId={`${formId}-video`}
        inputRef={videoInput}
        onAltChange={(value) => onUpdate('videoAlt', value)}
        onClear={onVideoClear}
        onDrop={onFileDrop}
        onFileChange={onFileChange}
        video={form.video}
        videoAlt={form.videoAlt}
      />
      <ContentField
        content={form.content}
        mode={form.contentMode}
        onContentChange={(value) => onUpdate('content', value)}
        onModeChange={(mode) => onUpdate('contentMode', mode)}
        type="인터뷰"
      />
      <label className="blog-form__field" htmlFor={`${formId}-seo-description`}>
        <span className="blog-form__label">SEO Description</span>
        <textarea
          className="blog-form__textarea blog-form__textarea--seo"
          id={`${formId}-seo-description`}
          name="seoDescription"
          onChange={(event) => onUpdate('seoDescription', event.currentTarget.value)}
          placeholder="SEO Description을 입력해주세요."
          value={form.seoDescription}
        />
      </label>
    </>
  )
}

type ReviewFieldsProps = {
  readonly form: ReviewFormState
  readonly formId: string
  readonly onUpdate: UpdateReviewForm
}

function ReviewFields({ form, formId, onUpdate }: ReviewFieldsProps) {
  return (
    <>
      <TextField
        id={`${formId}-company`}
        label="후기 고객사"
        name="company"
        onChange={(value) => onUpdate('company', value)}
        placeholder="후기 고객사를 입력해주세요."
        value={form.company}
      />
      <TextField
        id={`${formId}-manager`}
        label="후기 담당자"
        name="manager"
        onChange={(value) => onUpdate('manager', value)}
        placeholder="후기 담당자를 입력해주세요."
        value={form.manager}
      />
      <label className="blog-form__field" htmlFor={`${formId}-published-at`}>
        <span className="blog-form__label">후기 작성일</span>
        <input
          className="blog-form__control blog-form__control--date"
          id={`${formId}-published-at`}
          name="publishedAt"
          onChange={(event) => onUpdate('publishedAt', event.currentTarget.value)}
          onPointerDown={(event) => {
            if (!event.currentTarget.showPicker) return
            event.preventDefault()
            event.currentTarget.showPicker()
          }}
          required
          type="date"
          value={form.publishedAt}
        />
      </label>
      <ContentField
        content={form.content}
        mode={form.contentMode}
        onContentChange={(value) => onUpdate('content', value)}
        onModeChange={(mode) => onUpdate('contentMode', mode)}
        type="후기"
      />
      <LandingSetting
        checked={form.isLandingEnabled}
        onChange={(checked) => onUpdate('isLandingEnabled', checked)}
      />
    </>
  )
}
```

- [ ] **Step 5: Add the small review-only CSS layer.**

Create `apps/admin/src/pages/ReviewFormPage.css`. Most dimensions come from the existing Blog/Admin form CSS; this file only guarantees the upload label behaves like the existing button dropzone and that long filenames remain bounded.

```css
.blog-form__dropzone:is(label) {
  text-decoration: none;
}

.blog-form__thumbnail-chip {
  max-width: calc(100% - 64px);
}

@media (max-width: 520px) {
  .blog-form__thumbnail-chip {
    max-width: calc(100% - 32px);
  }
}
```

- [ ] **Step 6: Type-check and lint the new page before routing it.**

Run:

```bash
pnpm --filter admin build
pnpm --filter admin lint
```

Expected: both commands exit 0.

- [ ] **Step 7: Commit the conditional form.**

```bash
git add apps/admin/src/pages/ReviewFormPage.tsx apps/admin/src/pages/ReviewFormPage.css
git commit -m "feat(admin): add conditional interview review form"
```

---

### Task 3: Wire create/edit routes and protect the page contract

**Files:**

- Modify: `apps/admin/src/App.tsx`
- Modify: `apps/admin/src/pages/ReviewPage.tsx`
- Create: `apps/admin/tests/reviewFormPage.test.mjs`

**Interfaces:**

- Consumes: `ReviewFormPage` from Task 2 and the existing `/reviews/new` list CTA.
- Produces: reachable create/edit pages and regression coverage for both branch contracts.

- [ ] **Step 1: Write the failing route and source-contract test.**

Create `apps/admin/tests/reviewFormPage.test.mjs`:

```js
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const appPath = new URL('../src/App.tsx', import.meta.url)
const formPath = new URL('../src/pages/ReviewFormPage.tsx', import.meta.url)
const listPath = new URL('../src/pages/ReviewPage.tsx', import.meta.url)

test('review admin exposes create and edit routes', async () => {
  const [appSource, listSource] = await Promise.all([
    readFile(appPath, 'utf8'),
    readFile(listPath, 'utf8'),
  ])

  assert.match(appSource, /import \{ ReviewFormPage \} from '.\/pages\/ReviewFormPage'/)
  assert.match(
    appSource,
    /<Route element=\{<ReviewFormPage \/>\} path="\/reviews\/new" \/>/,
  )
  assert.match(
    appSource,
    /<Route element=\{<ReviewFormPage \/>\} path="\/reviews\/:reviewId" \/>/,
  )
  assert.match(listSource, /href: ['"]\/reviews\/new['"]/)
  assert.match(listSource, /인터뷰 · 후기 제목으로 검색해주세요\./)
})

test('review form has one fixed selector and two conditional field branches', async () => {
  const formSource = await readFile(formPath, 'utf8')

  assert.match(formSource, /options=\{reviewTypes\}/)
  assert.doesNotMatch(formSource, /allowCustomValue/)
  assert.match(formSource, /form\.type === '인터뷰'/)
  assert.match(formSource, /form\.type === '후기'/)
  assert.match(formSource, /인터뷰 제목/)
  assert.match(formSource, /인터뷰 Slug/)
  assert.match(formSource, /인터뷰 영상/)
  assert.match(formSource, /SEO Description/)
  assert.match(formSource, /후기 고객사/)
  assert.match(formSource, /후기 담당자/)
  assert.match(formSource, /\{type\} 내용/)
  assert.match(formSource, /name="isLandingEnabled"/)
  assert.match(formSource, /type="date"/)
  assert.match(formSource, /TEXT Editor 작성/)
  assert.match(formSource, /등록하기/)
  assert.doesNotMatch(formSource, /figma\.com\/api/)
})
```

- [ ] **Step 2: Run the focused page test and confirm the route failure.**

Run:

```bash
node --test apps/admin/tests/reviewFormPage.test.mjs
```

Expected: FAIL because `App.tsx` does not import/register `ReviewFormPage` and the review search placeholder is still Blog-specific.

- [ ] **Step 3: Register create and edit routes.**

In `apps/admin/src/App.tsx`, add the import beside `ReviewPage`:

```tsx
import { ReviewFormPage } from './pages/ReviewFormPage'
import { ReviewPage } from './pages/ReviewPage'
```

Add the specific routes immediately after the list route. React Router ranks them correctly, but keeping `new` adjacent to `:reviewId` makes the contract obvious.

```tsx
<Route element={<ReviewPage />} path="/reviews" />
<Route element={<ReviewFormPage />} path="/reviews/new" />
<Route element={<ReviewFormPage />} path="/reviews/:reviewId" />
```

- [ ] **Step 4: Correct the Review list search copy and retain edit links.**

In `apps/admin/src/pages/ReviewPage.tsx`, replace only the copied Blog placeholder:

```tsx
search={{
  label: '검색',
  placeholder: '인터뷰 · 후기 제목으로 검색해주세요.',
}}
```

Keep each row's existing `detailHref` contract. When real rows are supplied, their adapter must set it to `/reviews/${row.id}`; do not hard-code or fabricate empty fixture rows for this form task.

- [ ] **Step 5: Re-run the focused page and helper tests.**

Run:

```bash
node --experimental-strip-types --test \
  apps/admin/tests/reviewFormState.test.mjs \
  apps/admin/tests/reviewFormPage.test.mjs
```

Expected: all tests PASS.

- [ ] **Step 6: Commit routing and regression coverage.**

Stage the new test directly, then patch-stage only the `ReviewFormPage` import/two routes in `App.tsx` and the search-placeholder hunk in `ReviewPage.tsx`; both source files already contain unrelated worktree changes.

```bash
git add apps/admin/tests/reviewFormPage.test.mjs
git add -p apps/admin/src/App.tsx apps/admin/src/pages/ReviewPage.tsx
git commit -m "feat(admin): wire review form routes"
```

---

### Task 4: Verify behavior, visuals, responsiveness, and asset policy

**Files:**

- Verify only; no expected source changes.

**Interfaces:**

- Consumes: the routed form and all admin tests.
- Produces: evidence that the three Figma states and edit-mode copy work without regressions.

- [ ] **Step 1: Run the complete admin quality gate.**

Run:

```bash
pnpm --filter admin test
pnpm --filter admin build
pnpm --filter admin lint
```

Expected: tests PASS, TypeScript/Vite build exits 0, ESLint exits 0.

- [ ] **Step 2: Run the required Figma asset check.**

Run:

```bash
rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages
```

Expected: no output and exit status 1, meaning no forbidden remote Figma asset URL exists in source.

- [ ] **Step 3: Visually verify the three creation states at the Figma desktop width.**

Start the admin app:

```bash
pnpm --filter admin dev -- --host 127.0.0.1
```

At `/reviews/new` with a 1280px-wide viewport, verify:

1. Empty: only `신규 인터뷰 · 후기 등록`, the fixed selector, and action row are visible; it matches node `332:3027`.
2. Interview: selecting `인터뷰` reveals title, company, slug, date, video/ALT/dropzone, content tabs/body, and SEO in the order of node `332:3639`; no landing row is visible.
3. Review: selecting `후기` reveals company, manager, date, review-specific content tabs/body, and one checked `랜딩 설정 / 3개 등록됨` row as in node `332:3972`; no title, slug, video, or SEO field is visible.
4. Switching interview → review → interview restores previously typed branch values while showing only the active fields.
5. The fixed selector does not allow a custom third type.

- [ ] **Step 4: Verify validation, upload boundaries, and edit copy.**

In the browser, verify:

1. Submitting the empty state keeps the page in place, announces `인터뷰 · 후기 유형을 선택해주세요.`, and focuses the selector.
2. Interview slug strips unsupported characters and blocks submit when empty or invalid.
3. A valid MP4/MOV at or below 500MB displays `(1/1)` and a removable filename chip; WEBM and files over 500MB show the matching inline error.
4. Review fields use `후기 내용` copy; both branches use `TEXT Editor 작성` and `등록하기`.
5. `/reviews/example-id` shows edit-mode title ending in `수정` and the solid action label `수정하기`; after persistence is added, the record type will select the initial branch through the same state.

- [ ] **Step 5: Verify responsive behavior and basic accessibility.**

At 520px and 320px viewport widths, verify the form remains within the viewport, the action buttons stack according to `AdminFormLayout.css`, the video label/ALT controls stack according to existing Blog CSS, and no horizontal scroll appears. Keyboard through the selector, mode tabs, upload label, landing checkbox, list link, temporary-save button, and submit button; confirm visible order follows DOM order and every error is connected through `aria-describedby` or `role="alert"`.

- [ ] **Step 6: Inspect the final scoped diff.**

Run:

```bash
git diff -- \
  apps/admin/src/App.tsx \
  apps/admin/src/pages/ReviewPage.tsx \
  apps/admin/src/pages/ReviewFormPage.tsx \
  apps/admin/src/pages/ReviewFormPage.css \
  apps/admin/src/pages/reviewFormState.ts \
  apps/admin/tests/reviewFormPage.test.mjs \
  apps/admin/tests/reviewFormState.test.mjs
```

Expected: only the planned review-form work appears; no unrelated dirty-worktree edits are included.

## Acceptance Checklist

- [ ] `/reviews/new` initially matches Figma page 1 and shows no branch-specific fields.
- [ ] `인터뷰` selection matches Figma page 2 field order and excludes review-only controls.
- [ ] `후기` selection matches Figma page 3 field order and excludes interview-only controls.
- [ ] `/reviews/:reviewId` reuses the same component with edit title/submit copy.
- [ ] Type selection is fixed to exactly `인터뷰` and `후기`.
- [ ] Slug and video validation pass their boundary tests.
- [ ] Corrected Korean/editor copy is used consistently.
- [ ] Existing admin shell, form layout, combobox, icon registry, and CSS variables are reused.
- [ ] No persistence, fake rows, new dependency, or remote Figma asset URL is introduced.
- [ ] Admin tests, build, lint, visual checks, responsive checks, and Figma URL grep all pass.
