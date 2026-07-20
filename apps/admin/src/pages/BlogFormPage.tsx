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
      window.requestAnimationFrame(() => {
        document.getElementById(formId + '-type')?.focus()
      })
      return
    }

    if (!isValidEnglishSlug(form.slug)) {
      setSlugError('Slug는 영문과 하이픈만 입력할 수 있습니다.')
      window.requestAnimationFrame(() => {
        document.getElementById(formId + '-slug')?.focus()
      })
      return
    }

    setSlugError('')
    navigate('/blog')
  }

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

  return (
    <AdminFormLayout actions={formActions} onSubmit={handleSubmit} title={pageTitle}>
      <label className="blog-form__field" htmlFor={formId + '-type'}>
        <span className="blog-form__label">블로그 유형</span>
        <AdminTypeCombobox
          allowCustomValue
          errorMessage={typeError}
          inputId={formId + '-type'}
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
        {typeError ? (
          <span className="blog-form__error" id={formId + '-type-error'} role="alert">
            {typeError}
          </span>
        ) : null}
      </label>

      <label className="blog-form__field" htmlFor={formId + '-title'}>
        <span className="blog-form__label">블로그 제목</span>
        <input
          autoComplete="off"
          className="blog-form__control"
          id={formId + '-title'}
          name="title"
          onChange={(event) => updateForm('title', event.currentTarget.value)}
          placeholder="블로그 제목을 입력해주세요."
          required
          type="text"
          value={form.title}
        />
      </label>

      <label className="blog-form__field" htmlFor={formId + '-slug'}>
        <span className="blog-form__label">블로그 Slug</span>
        <input
          aria-describedby={slugError ? formId + '-slug-error' : undefined}
          aria-invalid={slugError ? true : undefined}
          autoComplete="off"
          className="blog-form__control"
          id={formId + '-slug'}
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
        {slugError ? (
          <span className="blog-form__error" id={formId + '-slug-error'} role="alert">
            {slugError}
          </span>
        ) : null}
      </label>

      <label className="blog-form__field" htmlFor={formId + '-published-at'}>
        <span className="blog-form__label">블로그 작성일</span>
        <input
          className="blog-form__control blog-form__control--date"
          id={formId + '-published-at'}
          name="publishedAt"
          onChange={(event) => updateForm('publishedAt', event.currentTarget.value)}
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

      <fieldset className="blog-form__thumbnail-field">
        <legend className="blog-form__label">블로그 썸네일</legend>
        <div className="blog-form__thumbnail-header">
          <span className="blog-form__thumbnail-label">
            <span className="blog-form__check">
              <AdminIcon name="check" />
            </span>
            <span>이미지 추가</span>
          </span>
          <label className="blog-form__thumbnail-alt" htmlFor={formId + '-thumbnail-alt'}>
            <span className="blog-form__visually-hidden">이미지 대체 텍스트</span>
            <input
              autoComplete="off"
              className="blog-form__alt-input"
              id={formId + '-thumbnail-alt'}
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
          aria-describedby={thumbnailError ? formId + '-thumbnail-error' : undefined}
          aria-invalid={thumbnailError ? true : undefined}
          className="blog-form__visually-hidden"
          id={formId + '-thumbnail'}
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
                <span className="blog-form__folder-icon">
                  <AdminIcon name="folder-up" size={20} />
                </span>
                <span className="blog-form__dropzone-copy">
                  <span>파일을 드래그 또는 클릭 후 파일 업로드 (0/1)</span>
                  <span>PNG, JPEG, WEBP 등 / 최대 50MB 제한</span>
                </span>
              </>
            )}
          </button>
          {form.thumbnail ? (
            <button
              aria-label={form.thumbnail.name + ' 삭제'}
              className="blog-form__thumbnail-chip"
              onClick={clearThumbnail}
              type="button"
            >
              <span className="blog-form__thumbnail-file-name" title={form.thumbnail.name}>
                {form.thumbnail.name}
              </span>
              <AdminIcon name="x-close" size={20} />
            </button>
          ) : null}
        </div>
        {thumbnailError ? (
          <span className="blog-form__error" id={formId + '-thumbnail-error'} role="alert">
            {thumbnailError}
          </span>
        ) : null}
      </fieldset>

      <fieldset className="blog-form__content-field">
        <legend className="blog-form__label">블로그 내용</legend>
        <div className="blog-form__mode-tabs">
          <button
            aria-pressed={form.contentMode === 'html'}
            className={
              form.contentMode === 'html'
                ? 'blog-form__mode-tab blog-form__mode-tab--active'
                : 'blog-form__mode-tab'
            }
            onClick={() => updateForm('contentMode', 'html')}
            type="button"
          >
            HTML 작성
          </button>
          <button
            aria-pressed={form.contentMode === 'text'}
            className={
              form.contentMode === 'text'
                ? 'blog-form__mode-tab blog-form__mode-tab--active'
                : 'blog-form__mode-tab'
            }
            onClick={() => updateForm('contentMode', 'text')}
            type="button"
          >
            TEXT Editer 작성
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

      <label className="blog-form__field" htmlFor={formId + '-seo-description'}>
        <span className="blog-form__label">SEO Description</span>
        <textarea
          className="blog-form__textarea blog-form__textarea--seo"
          id={formId + '-seo-description'}
          name="seoDescription"
          onChange={(event) => updateForm('seoDescription', event.currentTarget.value)}
          placeholder="SEO Description을 입력해주세요."
          value={form.seoDescription}
        />
      </label>

      <div className="blog-form__settings">
        <SettingRow
          checked={form.isLandingEnabled}
          count={blogSettingCounts.landing}
          label="랜딩 설정"
          onChange={(checked) => updateForm('isLandingEnabled', checked)}
        />
        <SettingRow
          checked={form.isBannerEnabled}
          count={blogSettingCounts.banner}
          label="배너 설정"
          onChange={(checked) => updateForm('isBannerEnabled', checked)}
        />
        <SettingRow
          checked={form.isFeaturedEnabled}
          count={blogSettingCounts.featured}
          label="주요게시글 설정"
          onChange={(checked) => updateForm('isFeaturedEnabled', checked)}
        />
      </div>
    </AdminFormLayout>
  )
}
