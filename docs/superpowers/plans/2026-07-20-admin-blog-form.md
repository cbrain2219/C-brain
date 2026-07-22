# Admin Blog Create/Edit Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Figma blog create/edit form at `/blog/new` and `/blog/:blogId`, including client-side validation and the exact initial visual state of node `628:6408`.

**Architecture:** Add one page-local `BlogFormPage` that composes the existing `AdminFormLayout`, `AdminTypeCombobox`, and `AdminIcon` rather than introducing a new form, picker, uploader, or editor abstraction. Reuse the already-tested Portfolio slug/image validator under Blog-local aliases; the new page keeps all other state locally and navigates back to `/blog` after a valid client-only submit.

**Tech Stack:** React 19, TypeScript, React Router 7, Vite 8, existing admin CSS variables, Pretendard, Node built-in test runner.

## Global Constraints

- Implement the Figma node as a 640px-wide form: 18/26 title, 14/20 labels and controls, 20px body-field gaps, 8px field-internal gaps, 52px controls, 16px control radius, 240px thumbnail dropzone, 480px content area, and 120px SEO area.
- Reuse `AdminFormLayout` for the page shell/actions, `AdminTypeCombobox` for a typed/selected blog type, existing `AdminIcon` glyphs for check/folder/close/arrow, and a native `<input type="date">` for the calendar picker. Do not add a date-picker or rich-text dependency.
- The Figma file supplies no blog type taxonomy or persistence API. Start with no type options, allow an operator to add a normalized type through the existing combobox, and do not invent category data.
- The current admin application has no create/update/read API. Creation and edit paths share blank local state; the edit path changes only title and submit copy, matching the existing Portfolio form convention. Do not fabricate a data store or mutate `blogRows`.
- Use the Figma initial setting state and display copy exactly: landing `true` / `3개 등록됨`, banner `true` / `2개 등록됨`, featured post `false` / `5개 등록됨`.
- Keep `thumbnail` local as one optional `File`; accept PNG, JPEG, and WEBP up to 50MB. Revoke its object URL on replace, clear, and unmount.
- Import `getPortfolioImageError` and `isValidPortfolioSlug` under Blog-local names instead of cloning or renaming their implementation. Their rules exactly match this Figma form; generalize the helper only when a third content form requires it.
- Apply `design.md`: Pretendard with `-0.015em` tracking, parent `gap` for normal layout spacing, `currentColor` SVG UI icons, no custom form focus styling, and no Figma MCP asset URL in application source. This screen needs no downloaded Figma asset because every referenced asset is a simple UI glyph already represented by local/native controls.
- Preserve unrelated dirty worktree changes. `BlogPage.tsx` already links its bottom action to `/blog/new`, so leave it unchanged.

---

### Task 1: Build the page-local blog form behavior and Figma control structure

**Files:**

- Create: `apps/admin/src/pages/BlogFormPage.tsx`
- Create: `apps/admin/src/pages/BlogFormPage.css`

**Consumes:** `AdminFormLayout`, `AdminTypeCombobox`, `AdminIcon`, `getPortfolioImageError`, and `isValidPortfolioSlug`.

**Produces:** A local-only form with `BlogContentMode`, one thumbnail, metadata, SEO copy, and three independently accessible settings.

- [ ] **Step 1: Define the local state and reusable setting-row markup.**

Create `BlogFormPage.css` first so the page import resolves during the behavior-only build. Its initial accessibility rule is already final and remains in the later Figma styling pass:

```css
.blog-form__visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  border: 0;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  overflow: hidden;
  white-space: nowrap;
}
```

Start `BlogFormPage.tsx` with the following imports, state, constants, and setting row. The form deliberately has one thumbnail rather than Portfolio's repeatable slots.

```tsx
import { useEffect, useId, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AdminIcon } from '../components/AdminIcon'
import { AdminFormLayout } from '../components/admin-form/AdminFormLayout'
import { AdminTypeCombobox } from '../components/admin-form/AdminTypeCombobox'
import {
  getPortfolioImageError as getImageUploadError,
  isValidPortfolioSlug as isValidEnglishSlug,
} from './portfolioFormState'
import './BlogFormPage.css'

type BlogContentMode = 'html' | 'text'

type BlogFormState = {
  readonly content: string
  readonly contentMode: BlogContentMode
  readonly isBannerEnabled: boolean
  readonly isFeaturedEnabled: boolean
  readonly isLandingEnabled: boolean
  readonly publishedAt: string
  readonly seoDescription: string
  readonly slug: string
  readonly thumbnail: File | null
  readonly thumbnailAlt: string
  readonly thumbnailPreviewUrl: string | null
  readonly title: string
  readonly type: string
}

const initialBlogForm: BlogFormState = {
  content: '',
  contentMode: 'html',
  isBannerEnabled: true,
  isFeaturedEnabled: false,
  isLandingEnabled: true,
  publishedAt: '',
  seoDescription: '',
  slug: '',
  thumbnail: null,
  thumbnailAlt: '',
  thumbnailPreviewUrl: null,
  title: '',
  type: '',
}

const blogSettingCounts = {
  banner: 2,
  featured: 5,
  landing: 3,
} as const

type SettingRowProps = {
  readonly checked: boolean
  readonly count: number
  readonly label: string
  readonly onChange: (checked: boolean) => void
}

function SettingRow({ checked, count, label, onChange }: SettingRowProps) {
  return (
    <label className="blog-form-setting">
      <input
        checked={checked}
        className="blog-form__visually-hidden"
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
          <span>{label}</span>
        </span>
        <span className="blog-form-setting__count">{count}개 등록됨</span>
      </span>
    </label>
  )
}
```

- [ ] **Step 2: Add controlled metadata, thumbnail, and submit behavior.**

Inside `BlogFormPage`, derive edit mode, manage a local type list, and call the existing Portfolio validation through the local aliases above. The date is native so the browser owns calendar display and keyboard behavior.

```tsx
export function BlogFormPage() {
  const formId = useId().replaceAll(':', '')
  const thumbnailInput = useRef<HTMLInputElement | null>(null)
  const thumbnailPreviewUrl = useRef<string | null>(null)
  const navigate = useNavigate()
  const { blogId } = useParams<{ blogId: string }>()
  const isEditing = blogId !== undefined
  const [form, setForm] = useState<BlogFormState>(initialBlogForm)
  const [blogTypes, setBlogTypes] = useState<string[]>([])
  const [slugError, setSlugError] = useState('')
  const [thumbnailError, setThumbnailError] = useState('')
  const [typeError, setTypeError] = useState('')

  const pageTitle = isEditing ? '블로그 수정' : '신규 블로그 등록'
  const submitLabel = isEditing ? '수정하기' : '등록하기'

  useEffect(
    () => () => {
      if (thumbnailPreviewUrl.current) URL.revokeObjectURL(thumbnailPreviewUrl.current)
    },
    [],
  )

  function updateForm<Key extends keyof BlogFormState>(key: Key, value: BlogFormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function commitBlogType(nextType: string) {
    if (!blogTypes.includes(nextType)) setBlogTypes((current) => [...current, nextType])

    updateForm('type', nextType)
    setTypeError('')
  }

  function releaseThumbnailPreview() {
    if (!thumbnailPreviewUrl.current) return

    URL.revokeObjectURL(thumbnailPreviewUrl.current)
    thumbnailPreviewUrl.current = null
  }

  function setThumbnail(file: File | undefined) {
    if (!file) return

    const errorMessage = getImageUploadError(file)

    if (errorMessage) {
      setThumbnailError(errorMessage)
      return
    }

    releaseThumbnailPreview()
    const previewUrl = URL.createObjectURL(file)

    thumbnailPreviewUrl.current = previewUrl
    setForm((current) => ({ ...current, thumbnail: file, thumbnailPreviewUrl: previewUrl }))
    setThumbnailError('')
  }

  function clearThumbnail() {
    releaseThumbnailPreview()
    setForm((current) => ({ ...current, thumbnail: null, thumbnailPreviewUrl: null }))
    setThumbnailError('')
    if (thumbnailInput.current) thumbnailInput.current.value = ''
  }

  function handleThumbnailChange(event: ChangeEvent<HTMLInputElement>) {
    setThumbnail(event.currentTarget.files?.[0])
  }

  function handleThumbnailDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    setThumbnail(event.dataTransfer.files[0])
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.type) {
      setTypeError('블로그 유형을 선택해주세요.')
      window.requestAnimationFrame(() => document.getElementById(`${formId}-type`)?.focus())
      return
    }

    if (!isValidEnglishSlug(form.slug)) {
      setSlugError('Slug는 영문과 하이픈만 입력할 수 있습니다.')
      window.requestAnimationFrame(() => document.getElementById(`${formId}-slug`)?.focus())
      return
    }

    setSlugError('')
    navigate('/blog')
  }
```

Render the Figma metadata controls before the thumbnail field:

```tsx
      <label className="blog-form__field" htmlFor={`${formId}-type`}>
        <span className="blog-form__label">블로그 유형</span>
        <AdminTypeCombobox
          allowCustomValue
          errorMessage={typeError}
          inputId={`${formId}-type`}
          name="type"
          onClear={() => {
            updateForm('type', '')
            setTypeError('')
          }}
          onCommit={commitBlogType}
          options={blogTypes}
          placeholder="블로그유형을 선택해주세요."
          value={form.type}
        />
        {typeError ? <span className="blog-form__error" id={`${formId}-type-error`} role="alert">{typeError}</span> : null}
      </label>

      <label className="blog-form__field" htmlFor={`${formId}-title`}>
        <span className="blog-form__label">블로그 제목</span>
        <input
          autoComplete="off"
          className="blog-form__control"
          id={`${formId}-title`}
          name="title"
          onChange={(event) => updateForm('title', event.currentTarget.value)}
          placeholder="블로그 제목을 입력해주세요."
          required
          type="text"
          value={form.title}
        />
      </label>

      <label className="blog-form__field" htmlFor={`${formId}-slug`}>
        <span className="blog-form__label">블로그 Slug</span>
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

            updateForm('slug', slug)
            setSlugError(rawValue === slug ? '' : '영어와 하이픈만 입력해주세요.')
          }}
          onInvalid={() => setSlugError('Slug는 영문과 하이픈만 입력할 수 있습니다.')}
          pattern="[A-Za-z-]+"
          placeholder="블로그 Slug를 입력해주세요. (영문만 작성)"
          required
          type="text"
          value={form.slug}
        />
        {slugError ? <span className="blog-form__error" id={`${formId}-slug-error`} role="alert">{slugError}</span> : null}
      </label>

      <label className="blog-form__field" htmlFor={`${formId}-published-at`}>
        <span className="blog-form__label">블로그 작성일</span>
        <input
          className="blog-form__control blog-form__control--date"
          id={`${formId}-published-at`}
          name="publishedAt"
          onChange={(event) => updateForm('publishedAt', event.currentTarget.value)}
          required
          type="date"
          value={form.publishedAt}
        />
      </label>
```

- [ ] **Step 3: Render the one-file thumbnail and visible selected-file state.**

The empty state must match Figma's `이미지 추가`, ALT input, folder icon, `0/1`, and accepted-file text. A selected image adds only the minimal preview/file chip needed to replace or clear a local selection; it does not add a remote upload flow.

```tsx
      <fieldset className="blog-form__thumbnail-field">
        <legend className="blog-form__label">블로그 썸네일</legend>
        <div className="blog-form__thumbnail-header">
          <span className="blog-form__thumbnail-label">
            <span className="blog-form__check"><AdminIcon name="check" /></span>
            <span>이미지 추가</span>
          </span>
          <label className="blog-form__thumbnail-alt" htmlFor={`${formId}-thumbnail-alt`}>
            <span className="blog-form__visually-hidden">이미지 대체 텍스트</span>
            <input
              autoComplete="off"
              className="blog-form__alt-input"
              id={`${formId}-thumbnail-alt`}
              name="thumbnailAlt"
              onChange={(event) => updateForm('thumbnailAlt', event.currentTarget.value)}
              placeholder="IMAGE ALT TAG를 입력해주세요."
              type="text"
              value={form.thumbnailAlt}
            />
          </label>
        </div>
        <input
          accept="image/png,image/jpeg,image/webp"
          aria-describedby={thumbnailError ? `${formId}-thumbnail-error` : undefined}
          aria-invalid={thumbnailError ? true : undefined}
          className="blog-form__visually-hidden"
          id={`${formId}-thumbnail`}
          onChange={handleThumbnailChange}
          ref={thumbnailInput}
          type="file"
        />
        <div className="blog-form__thumbnail-preview-wrap">
          <button
            className={
              form.thumbnailPreviewUrl
                ? 'blog-form__dropzone blog-form__dropzone--preview'
                : 'blog-form__dropzone'
            }
            onClick={() => thumbnailInput.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleThumbnailDrop}
            type="button"
          >
            {form.thumbnailPreviewUrl ? (
              <img
                alt={form.thumbnailAlt || '선택한 블로그 썸네일 미리보기'}
                className="blog-form__thumbnail-preview"
                src={form.thumbnailPreviewUrl}
              />
            ) : (
              <>
                <span className="blog-form__folder-icon"><AdminIcon name="folder-up" size={20} /></span>
                <span className="blog-form__dropzone-copy">
                  <span>파일을 드래그 또는 클릭 후 파일 업로드 (0/1)</span>
                  <span>PNG, JPEG, WEBP 등 / 최대 50MB 제한</span>
                </span>
              </>
            )}
          </button>
          {form.thumbnail ? (
            <button
              aria-label={`${form.thumbnail.name} 삭제`}
              className="blog-form__thumbnail-chip"
              onClick={clearThumbnail}
              type="button"
            >
              <span className="blog-form__thumbnail-file-name" title={form.thumbnail.name}>{form.thumbnail.name}</span>
              <AdminIcon name="x-close" size={20} />
            </button>
          ) : null}
        </div>
        {thumbnailError ? <span className="blog-form__error" id={`${formId}-thumbnail-error`} role="alert">{thumbnailError}</span> : null}
      </fieldset>
```

- [ ] **Step 4: Render content mode, SEO description, settings, and existing action semantics.**

Use a textarea for both content modes; there is no editor specification or package to add. Use the corrected label spelling `TEXT Editor 작성`.

```tsx
      <fieldset className="blog-form__content-field">
        <legend className="blog-form__label">블로그 내용</legend>
        <div className="blog-form__mode-tabs">
          <button
            aria-pressed={form.contentMode === 'html'}
            className={form.contentMode === 'html' ? 'blog-form__mode-tab blog-form__mode-tab--active' : 'blog-form__mode-tab'}
            onClick={() => updateForm('contentMode', 'html')}
            type="button"
          >
            HTML 작성
          </button>
          <button
            aria-pressed={form.contentMode === 'text'}
            className={form.contentMode === 'text' ? 'blog-form__mode-tab blog-form__mode-tab--active' : 'blog-form__mode-tab'}
            onClick={() => updateForm('contentMode', 'text')}
            type="button"
          >
            TEXT Editor 작성
          </button>
        </div>
        <textarea
          className="blog-form__textarea blog-form__textarea--content"
          name="content"
          onChange={(event) => updateForm('content', event.currentTarget.value)}
          placeholder="블로그 내용을 입력해주세요."
          required
          value={form.content}
        />
      </fieldset>

      <label className="blog-form__field" htmlFor={`${formId}-seo-description`}>
        <span className="blog-form__label">SEO Description</span>
        <textarea
          className="blog-form__textarea blog-form__textarea--seo"
          id={`${formId}-seo-description`}
          name="seoDescription"
          onChange={(event) => updateForm('seoDescription', event.currentTarget.value)}
          placeholder="SEO Description을 입력해주세요."
          value={form.seoDescription}
        />
      </label>

      <div className="blog-form__settings">
        <SettingRow checked={form.isLandingEnabled} count={blogSettingCounts.landing} label="랜딩 설정" onChange={(checked) => updateForm('isLandingEnabled', checked)} />
        <SettingRow checked={form.isBannerEnabled} count={blogSettingCounts.banner} label="배너 설정" onChange={(checked) => updateForm('isBannerEnabled', checked)} />
        <SettingRow checked={form.isFeaturedEnabled} count={blogSettingCounts.featured} label="주요게시글 설정" onChange={(checked) => updateForm('isFeaturedEnabled', checked)} />
      </div>
    </AdminFormLayout>
  )
}
```

Inside `BlogFormPage` immediately before its return statement, define the exact action value below. Pass it as `actions` to `AdminFormLayout` with `onSubmit={handleSubmit}` and `title={pageTitle}`. Place the metadata, thumbnail, content, SEO, and settings blocks from the preceding steps in that order as its children.

```tsx
const formActions = (
  <>
    <Link className="admin-form__button admin-form__button--outline" to="/blog">
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
```

- [ ] **Step 5: Run the existing validation test and compile the isolated page.**

Run: `pnpm --filter admin test && pnpm --filter admin lint && pnpm --filter admin build`

Expected: PASS. `portfolioFormState.test.mjs` keeps the reused slug and image branches covered; no new pure validation logic was added. The page remains unreachable until the next task adds its routes.

### Task 2: Add Figma geometry, route integration, and end-to-end verification

**Files:**

- Modify: `apps/admin/src/pages/BlogFormPage.css`
- Modify: `apps/admin/src/App.tsx`

**Consumes:** `BlogFormPage` from Task 1.

**Produces:** Styled `/blog/new` and `/blog/:blogId` pages reachable from the existing Blog list action.

- [ ] **Step 1: Add the narrowly scoped blog form CSS.**

Implement the following structural rules first; every regular sibling spacing relationship uses `gap`, not margins.

```css
.blog-form__field,
.blog-form__thumbnail-field,
.blog-form__content-field,
.blog-form__settings {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.blog-form__label,
.blog-form__control,
.blog-form__alt-input,
.blog-form__textarea,
.blog-form__thumbnail-label,
.blog-form-setting,
.blog-form__error {
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 21px;
  letter-spacing: -0.015em;
}

.blog-form__label {
  color: var(--admin-gray-800);
  font-weight: 500;
}

.blog-form__control,
.blog-form__alt-input,
.blog-form__textarea {
  width: 100%;
  border: 1px solid #f1f5f9;
  border-radius: 16px;
  background: var(--admin-surface);
  color: var(--admin-gray-800);
  font-weight: 500;
}

.blog-form__control,
.blog-form__alt-input {
  height: 52px;
  padding: 0 16px;
}

.blog-form__control::placeholder,
.blog-form__alt-input::placeholder,
.blog-form__textarea::placeholder {
  color: var(--admin-gray-400);
  opacity: 1;
}

.blog-form__textarea {
  padding: 16px;
  resize: vertical;
}

.blog-form__textarea--content {
  height: 480px;
  min-height: 480px;
}

.blog-form__textarea--seo {
  height: 120px;
  min-height: 120px;
}
```

Add these Figma-specific groups and states:

```css
.blog-form__thumbnail-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.blog-form__thumbnail-label {
  height: 52px;
  flex: 0 0 auto;
  padding: 0 16px;
  border: 1px solid #f1f5f9;
  border-radius: 16px;
  background: var(--admin-gray-50);
  color: var(--admin-gray-800);
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.blog-form__thumbnail-alt {
  min-width: 0;
  flex: 1 1 auto;
}

.blog-form__check,
.blog-form-setting__check {
  width: 24px;
  height: 24px;
  flex: 0 0 auto;
  border-radius: 8px;
  background: var(--admin-gray-400);
  color: var(--admin-text-inverse);
  display: flex;
  align-items: center;
  justify-content: center;
}

.blog-form__check,
.blog-form-setting__check--checked {
  background: var(--admin-brand-500);
}

.blog-form__dropzone {
  width: 100%;
  height: 240px;
  padding: 16px;
  border: 1px dashed #f1f5f9;
  border-radius: 16px;
  background: var(--admin-gray-50);
  color: var(--admin-gray-800);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.blog-form__folder-icon {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background: var(--admin-gray-100);
  display: flex;
  align-items: center;
  justify-content: center;
}

.blog-form__dropzone-copy {
  color: var(--admin-gray-600);
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  letter-spacing: -0.015em;
  text-align: center;
  display: flex;
  flex-direction: column;
}

.blog-form__dropzone-copy > span:last-child,
.blog-form-setting__count {
  color: var(--admin-gray-400);
}
```

Finish the remaining visual states with this CSS. Do not add an input/select/textarea focus selector.

```css
.blog-form__thumbnail-preview-wrap {
  position: relative;
}

.blog-form__dropzone--preview {
  height: auto;
  min-height: 0;
  padding: 0;
  overflow: hidden;
}

.blog-form__thumbnail-preview {
  width: 100%;
  height: auto;
  display: block;
}

.blog-form__thumbnail-chip {
  position: absolute;
  z-index: 1;
  top: 50%;
  left: 50%;
  max-width: calc(100% - 32px);
  height: 32px;
  padding: 4px 8px;
  border: 0;
  border-radius: 16px;
  transform: translate(-50%, -50%);
  background: rgb(255 255 255 / 50%);
  backdrop-filter: blur(5px);
  color: var(--admin-gray-800);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.blog-form__thumbnail-file-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.blog-form__mode-tabs {
  width: 100%;
  min-height: 52px;
  padding: 4px;
  border-radius: 16px;
  background: var(--admin-gray-50);
  display: flex;
  align-items: stretch;
  gap: 4px;
}

.blog-form__mode-tab {
  min-width: 0;
  min-height: 44px;
  flex: 1 1 0;
  padding: 0 16px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--admin-gray-600);
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 500;
  line-height: 21px;
  letter-spacing: -0.015em;
  cursor: pointer;
}

.blog-form__mode-tab--active {
  border-radius: 14px;
  background: var(--admin-brand-500);
  color: var(--admin-text-inverse);
}

.blog-form-setting {
  height: 52px;
  padding: 0 16px;
  border: 1px solid #f1f5f9;
  border-radius: 16px;
  background: var(--admin-gray-50);
  color: var(--admin-gray-800);
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.blog-form-setting__content {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.blog-form-setting__label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.blog-form__error {
  color: var(--color-error-500);
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
}

@media (max-width: 520px) {
  .blog-form__thumbnail-header {
    align-items: stretch;
    flex-direction: column;
  }

  .blog-form__thumbnail-label {
    width: 100%;
  }

  .blog-form__dropzone {
    height: 200px;
  }

  .blog-form__mode-tab {
    padding: 0 8px;
  }
}
```

- [ ] **Step 2: Wire both routes immediately after the existing `/blog` list route.**

Add the import:

```tsx
import { BlogFormPage } from './pages/BlogFormPage'
```

Then use these routes, keeping the existing list route intact:

```tsx
<Route element={<BlogPage />} path="/blog" />
<Route element={<BlogFormPage />} path="/blog/new" />
<Route element={<BlogFormPage />} path="/blog/:blogId" />
```

- [ ] **Step 3: Run automated verification.**

Run:

```bash
pnpm --filter admin test
pnpm --filter admin lint
pnpm --filter admin build
git diff --check
```

Expected: every command exits `0`.

- [ ] **Step 4: Verify the visible and interactive paths in a browser.**

Run: `pnpm --filter admin dev -- --host 127.0.0.1`

Check all of the following:

1. `/blog/new` uses the shared 640px form shell and matches the Figma initial state: title, empty type/title/slug/date fields, 240px thumbnail empty state, active HTML tab, 480px content area, 120px SEO area, and the three 3/2/5 setting rows.
2. A type entered into the empty combobox commits on Enter; blank type cannot submit and is focused with its inline message.
3. The native date field opens the platform calendar; no third-party picker or hand-drawn calendar icon appears.
4. Empty required title, slug, date, and content fields are blocked by native validation and scrolled into view by the existing app-level invalid handler.
5. `cbrain-blog` is accepted. Korean, digits, and spaces are stripped from the slug input and leave the Korean inline error visible until the field is valid.
6. A 50MB WEBP is accepted; a PDF and a 50MB-plus PNG show the existing validation messages; replacing and removing an image does not leak an object URL or leave a stale file input value.
7. The HTML/TEXT controls change only the active mode state and preserve the one textarea value. Landing/banner/featured settings toggle individually.
8. `/blog/example-id` changes only the page title to `블로그 수정` and CTA to `수정하기`; 목록으로 and successful submit both return to `/blog`.

- [ ] **Step 5: Run the required Figma asset leak check.**

Run:

```bash
rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages
```

Expected: no output. `rg` exits `1` when it finds no matches; treat that no-match exit status as the successful result for this check.

- [ ] **Step 6: Commit the page, styles, and route integration.**

```bash
git add apps/admin/src/pages/BlogFormPage.tsx \
  apps/admin/src/pages/BlogFormPage.css \
  apps/admin/src/App.tsx
git commit -m "feat(admin): add blog create and edit form"
```

## Self-Review

- The plan maps every Figma control: type, title, slug, date, one thumbnail/ALT/dropzone, HTML/TEXT mode, 480px content, SEO description, landing/banner/featured settings, and the shared action footer.
- The existing Portfolio validation is reused under local aliases. It is not generalized prematurely; upload UI and editor-mode state remain local to the Blog page, avoiding a generic uploader or editor that has no third caller.
- No API, mock persistence, category taxonomy, image asset, remote Figma URL, date library, or rich-text package is introduced.
- Automated coverage keeps all slug and image-validation branches checked; lint/build/diff checks cover integration; browser checks cover native form, file, routing, and Figma-visible behavior.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-20-admin-blog-form.md`.

1. **Inline Execution** — implement the two tasks in this session with a verification checkpoint after each task.
2. **Separate Execution** — start a fresh implementation session and execute the saved plan task by task with `superpowers:executing-plans`.
