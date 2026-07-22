import { createPost, deletePost, getAdminPost, listAdminPosts, updatePost } from '@repo/supabase'
import { useEffect, useId, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AdminIcon } from '../components/AdminIcon'
import { AdminDeleteDialog } from '../components/admin-form/AdminDeleteDialog'
import { AdminFormLayout } from '../components/admin-form/AdminFormLayout'
import { AdminTypeCombobox } from '../components/admin-form/AdminTypeCombobox'
import { deletePublicAssets, getPublicAssetUrl, uploadPublicAsset } from '../lib/adminAssets'
import { supabase } from '../lib/supabase'
import {
  createInitialBlogForm,
  getBlogSettingCounts,
  toBlogFormState,
  toBlogMutationInput,
} from './blogData'
import type { BlogFormState, BlogSettingCounts, BlogStatus } from './blogData'
import { getSubmitIntent } from './contentListState'
import {
  getPortfolioImageError as getImageUploadError,
  isValidPortfolioSlug as isValidEnglishSlug,
} from './portfolioFormState'
import './BlogFormPage.css'

const emptyBlogSettingCounts: BlogSettingCounts = { banner: 0, featured: 0, landing: 0 }

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
  const thumbnailObjectUrl = useRef<string | null>(null)
  const navigate = useNavigate()
  const { blogId } = useParams<{ blogId: string }>()
  const isEditing = blogId !== undefined
  const [form, setForm] = useState<BlogFormState>(createInitialBlogForm)
  const [blogTypes, setBlogTypes] = useState<string[]>([])
  const [blogSettingCounts, setBlogSettingCounts] =
    useState<BlogSettingCounts>(emptyBlogSettingCounts)
  const [slugError, setSlugError] = useState('')
  const [thumbnailError, setThumbnailError] = useState('')
  const [typeError, setTypeError] = useState('')
  const [persistedThumbnailPath, setPersistedThumbnailPath] = useState<string | null>(null)
  const [isLoadingBlog, setIsLoadingBlog] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [saveError, setSaveError] = useState('')

  const pageTitle = isEditing ? '블로그 수정' : '신규 블로그 등록'
  const submitLabel = isEditing ? '수정하기' : '등록하기'

  useEffect(() => {
    let isCurrent = true

    async function loadBlog() {
      setIsLoadingBlog(true)
      setLoadError('')

      try {
        const [posts, post] = await Promise.all([
          listAdminPosts(supabase, 'blog'),
          blogId ? getAdminPost(supabase, blogId, 'blog') : Promise.resolve(null),
        ])

        if (!isCurrent) return

        setBlogTypes([...new Set(posts.map((item) => item.type))])
        setBlogSettingCounts(getBlogSettingCounts(posts))

        if (post) {
          setForm(toBlogFormState(post, getPublicAssetUrl(post.thumbnail_path)))
          setPersistedThumbnailPath(post.thumbnail_path)
          setBlogTypes((current) =>
            current.includes(post.type) ? current : [...current, post.type],
          )
        } else {
          setForm(createInitialBlogForm())
          setPersistedThumbnailPath(null)
        }
      } catch {
        if (!isCurrent) return

        if (blogId) {
          setLoadError('블로그 정보를 불러오지 못했습니다.')
          toast.error('블로그 정보를 불러오지 못했습니다.')
        } else {
          setBlogTypes([])
          setBlogSettingCounts(emptyBlogSettingCounts)
          toast.error('기존 블로그 설정 현황을 불러오지 못했습니다.')
        }
      } finally {
        if (isCurrent) setIsLoadingBlog(false)
      }
    }

    void loadBlog()

    return () => {
      isCurrent = false
    }
  }, [blogId])

  useEffect(
    () => () => {
      if (thumbnailObjectUrl.current) URL.revokeObjectURL(thumbnailObjectUrl.current)
    },
    [],
  )

  function updateForm<Key extends keyof BlogFormState>(key: Key, value: BlogFormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function commitBlogType(nextType: string) {
    const type = nextType.trim()

    if (!type) return
    if (!blogTypes.includes(type)) setBlogTypes((current) => [...current, type])

    updateForm('type', type)
    setTypeError('')
  }

  function releaseThumbnailPreview() {
    if (!thumbnailObjectUrl.current) return

    URL.revokeObjectURL(thumbnailObjectUrl.current)
    thumbnailObjectUrl.current = null
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

    thumbnailObjectUrl.current = previewUrl
    setForm((current) => ({ ...current, thumbnail: file, thumbnailPreviewUrl: previewUrl }))
    setThumbnailError('')
  }

  function clearThumbnail() {
    releaseThumbnailPreview()
    setForm((current) => ({
      ...current,
      thumbnail: null,
      thumbnailPath: null,
      thumbnailPreviewUrl: null,
    }))
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

  async function persist(status: BlogStatus) {
    if (isSaving || isDeleting) return

    let uploadedThumbnailPath: string | null = null

    setIsSaving(true)
    setSaveError('')

    try {
      if (form.thumbnail) {
        uploadedThumbnailPath = await uploadPublicAsset('blog-thumbnails', form.thumbnail)
      }

      const nextThumbnailPath = uploadedThumbnailPath ?? form.thumbnailPath
      const input = toBlogMutationInput(form, status, nextThumbnailPath)

      if (blogId) {
        await updatePost(supabase, blogId, input)
      } else {
        await createPost(supabase, input)
      }

      if (persistedThumbnailPath && persistedThumbnailPath !== nextThumbnailPath) {
        try {
          await deletePublicAssets([persistedThumbnailPath])
        } catch {
          toast.error('기존 썸네일 파일을 정리하지 못했습니다.')
          window.alert('블로그는 저장됐지만 기존 썸네일 파일을 정리하지 못했습니다.')
        }
      }

      toast.success(status === 'draft' ? '임시저장했습니다.' : '블로그를 저장했습니다.')
      navigate('/blog', { replace: status === 'draft' })
    } catch {
      if (uploadedThumbnailPath) {
        await deletePublicAssets([uploadedThumbnailPath]).catch(() => undefined)
      }

      setSaveError('블로그를 저장하지 못했습니다. 입력값과 권한을 확인해주세요.')
      toast.error('블로그를 저장하지 못했습니다.')
      window.alert('블로그를 저장하지 못했습니다. 다시 시도해주세요.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!blogId || isSaving || isDeleting) return

    setIsDeleting(true)
    setSaveError('')

    try {
      await deletePost(supabase, blogId)

      try {
        await deletePublicAssets([persistedThumbnailPath])
      } catch {
        toast.error('썸네일 파일을 정리하지 못했습니다.')
        window.alert('블로그는 삭제됐지만 썸네일 파일을 정리하지 못했습니다.')
      }

      toast.success('블로그를 삭제했습니다.')
      navigate('/blog', { replace: true })
    } catch {
      setSaveError('블로그를 삭제하지 못했습니다. 권한을 확인해주세요.')
      toast.error('블로그를 삭제하지 못했습니다.')
      window.alert('블로그를 삭제하지 못했습니다. 다시 시도해주세요.')
    } finally {
      setIsDeleting(false)
    }
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
    void persist(getSubmitIntent(event) === 'draft' ? 'draft' : 'published')
  }

  if (isLoadingBlog || loadError) {
    return (
      <AdminFormLayout
        actions={
          <Link className="admin-form__button admin-form__button--outline" to="/blog">
            목록으로
          </Link>
        }
        onSubmit={(event) => event.preventDefault()}
        title={pageTitle}
      >
        <p className="blog-form__error" role={loadError ? 'alert' : 'status'}>
          {loadError || '블로그 정보를 불러오는 중입니다.'}
        </p>
      </AdminFormLayout>
    )
  }

  const formActions = (
    <>
      <Link className="admin-form__button admin-form__button--outline" to="/blog">
        목록으로
      </Link>
      <div className="admin-form__actions-group">
        {isEditing ? (
          <AdminDeleteDialog
            disabled={isSaving}
            isDeleting={isDeleting}
            itemLabel="블로그"
            onConfirm={handleDelete}
          />
        ) : null}
        <button
          className="admin-form__button admin-form__button--outline"
          disabled={isSaving || isDeleting}
          name="intent"
          type="submit"
          value="draft"
        >
          임시저장
        </button>
        <button
          className="admin-form__button admin-form__button--solid"
          disabled={isSaving || isDeleting}
          name="intent"
          type="submit"
          value="published"
        >
          <span>{submitLabel}</span>
          <AdminIcon name="arrow-right" />
        </button>
      </div>
    </>
  )

  return (
    <AdminFormLayout actions={formActions} onSubmit={handleSubmit} title={pageTitle}>
      {saveError ? (
        <p className="blog-form__error" role="alert">
          {saveError}
        </p>
      ) : null}

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
          {form.thumbnailPreviewUrl ? (
            <button
              aria-label={(form.thumbnail?.name ?? '현재 썸네일') + ' 삭제'}
              className="blog-form__thumbnail-chip"
              onClick={clearThumbnail}
              type="button"
            >
              <span
                className="blog-form__thumbnail-file-name"
                title={form.thumbnail?.name ?? form.thumbnailPath ?? '현재 썸네일'}
              >
                {form.thumbnail?.name ?? form.thumbnailPath?.split('/').at(-1) ?? '현재 썸네일'}
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
