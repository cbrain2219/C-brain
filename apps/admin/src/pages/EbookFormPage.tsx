import {
  createEbook,
  deleteEbook,
  getAdminEbook,
  updateEbook,
} from '@repo/supabase'
import { useEffect, useId, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AdminIcon } from '../components/AdminIcon'
import { AdminDeleteDialog } from '../components/admin-form/AdminDeleteDialog'
import { AdminFormLayout } from '../components/admin-form/AdminFormLayout'
import {
  deletePublicAssets,
  getPublicAssetUrl,
  uploadPublicAsset,
} from '../lib/adminAssets'
import { supabase } from '../lib/supabase'
import {
  createInitialEbookForm,
  getEbookOgImageDisplayName,
  isValidEbookSlug,
  isValidEbookUrl,
  sanitizeEbookEmbedUrl,
  sanitizeEbookSlug,
  toEbookFormState,
  toEbookMutationInput,
} from './ebookData'
import type { EbookFormState } from './ebookData'
import { getPortfolioImageError } from './portfolioFormState'
import './BlogFormPage.css'

export function EbookFormPage() {
  const formId = useId().replaceAll(':', '')
  const ogImageInput = useRef<HTMLInputElement | null>(null)
  const ogImageObjectUrl = useRef<string | null>(null)
  const navigate = useNavigate()
  const { ebookId } = useParams<{ ebookId: string }>()
  const isEditing = ebookId !== undefined
  const [form, setForm] = useState(createInitialEbookForm)
  const [embedUrlError, setEmbedUrlError] = useState('')
  const [ogImageError, setOgImageError] = useState('')
  const [slugError, setSlugError] = useState('')
  const [persistedOgImagePath, setPersistedOgImagePath] = useState<
    string | null
  >(null)
  const [isLoading, setIsLoading] = useState(isEditing)
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const operationInFlight = useRef(false)

  useEffect(() => {
    let isCurrent = true
    const id = ebookId

    if (!id) return

    void getAdminEbook(supabase, id)
      .then((ebook) => {
        if (!isCurrent) return

        setForm(toEbookFormState(ebook, getPublicAssetUrl(ebook.og_image_path)))
        setPersistedOgImagePath(ebook.og_image_path)
      })
      .catch(() => {
        if (!isCurrent) return
        setLoadError('E-book 정보를 불러오지 못했습니다.')
        toast.error('E-book 정보를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [ebookId])

  useEffect(
    () => () => {
      if (ogImageObjectUrl.current) {
        URL.revokeObjectURL(ogImageObjectUrl.current)
      }
    },
    [],
  )

  function updateForm<Key extends keyof EbookFormState>(
    key: Key,
    value: EbookFormState[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function validateForm() {
    const hasValidUrl = isValidEbookUrl(form.embedUrl)
    const hasValidSlug = isValidEbookSlug(form.slug)

    setEmbedUrlError(
      hasValidUrl ? '' : '영문으로 된 http 또는 https URL을 입력해주세요.',
    )
    setSlugError(
      hasValidSlug
        ? ''
        : 'Slug는 영문 소문자, 숫자, 하이픈만 입력할 수 있습니다.',
    )

    if (!hasValidUrl) {
      window.requestAnimationFrame(() =>
        document.getElementById(`${formId}-embed-url`)?.focus(),
      )
    } else if (!hasValidSlug) {
      window.requestAnimationFrame(() =>
        document.getElementById(`${formId}-slug`)?.focus(),
      )
    }

    return hasValidUrl && hasValidSlug
  }

  function releaseOgImagePreview() {
    if (!ogImageObjectUrl.current) return

    URL.revokeObjectURL(ogImageObjectUrl.current)
    ogImageObjectUrl.current = null
  }

  function setOgImage(file: File | undefined) {
    if (!file) return

    const errorMessage = getPortfolioImageError(file)

    if (errorMessage) {
      setOgImageError(errorMessage)
      return
    }

    releaseOgImagePreview()

    const previewUrl = URL.createObjectURL(file)

    ogImageObjectUrl.current = previewUrl
    setForm((current) => ({
      ...current,
      ogImage: file,
      ogImageFileName: file.name,
      ogImagePreviewUrl: previewUrl,
    }))
    setOgImageError('')
  }

  function clearOgImage() {
    releaseOgImagePreview()
    setForm((current) => ({
      ...current,
      ogImage: null,
      ogImageAlt: '',
      ogImageFileName: null,
      ogImagePath: null,
      ogImagePreviewUrl: null,
    }))
    setOgImageError('')

    if (ogImageInput.current) ogImageInput.current.value = ''
  }

  function handleOgImageChange(event: ChangeEvent<HTMLInputElement>) {
    setOgImage(event.currentTarget.files?.[0])
  }

  function handleOgImageDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    setOgImage(event.dataTransfer.files[0])
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (operationInFlight.current || !validateForm()) return

    operationInFlight.current = true
    setIsSaving(true)
    setSaveError('')

    let uploadedOgImagePath: string | null = null

    try {
      if (form.ogImage) {
        uploadedOgImagePath = await uploadPublicAsset(
          'ebook-og-images',
          form.ogImage,
        )
      }

      const nextOgImagePath = uploadedOgImagePath ?? form.ogImagePath
      const input = toEbookMutationInput(form, 'published', nextOgImagePath)

      if (ebookId) await updateEbook(supabase, ebookId, input)
      else await createEbook(supabase, input)

      if (persistedOgImagePath && persistedOgImagePath !== nextOgImagePath) {
        try {
          await deletePublicAssets([persistedOgImagePath])
        } catch {
          toast.error('기존 OG 이미지 파일을 정리하지 못했습니다.')
          window.alert(
            'E-book은 저장됐지만 기존 OG 이미지 파일을 정리하지 못했습니다.',
          )
        }
      }

      toast.success(
        isEditing ? 'E-book을 수정했습니다.' : 'E-book을 등록했습니다.',
      )
      navigate('/ebook')
    } catch {
      if (uploadedOgImagePath) {
        await deletePublicAssets([uploadedOgImagePath]).catch(() => undefined)
      }

      setSaveError(
        'E-book을 저장하지 못했습니다. 입력값과 권한을 확인해주세요.',
      )
      toast.error('E-book을 저장하지 못했습니다.')
      window.alert('E-book을 저장하지 못했습니다. 다시 시도해주세요.')
    } finally {
      operationInFlight.current = false
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!ebookId || operationInFlight.current) return

    operationInFlight.current = true
    setIsDeleting(true)
    setSaveError('')

    try {
      await deleteEbook(supabase, ebookId)

      try {
        await deletePublicAssets([persistedOgImagePath])
      } catch {
        toast.error('OG 이미지 파일을 정리하지 못했습니다.')
        window.alert(
          'E-book은 삭제됐지만 OG 이미지 파일을 정리하지 못했습니다.',
        )
      }

      toast.success('E-book을 삭제했습니다.')
      navigate('/ebook', { replace: true })
    } catch {
      setSaveError('E-book을 삭제하지 못했습니다.')
      toast.error('E-book을 삭제하지 못했습니다.')
    } finally {
      operationInFlight.current = false
      setIsDeleting(false)
    }
  }

  if (isLoading || loadError) {
    return (
      <AdminFormLayout
        actions={
          <Link
            className="admin-form__button admin-form__button--outline"
            to="/ebook"
          >
            목록으로
          </Link>
        }
        onSubmit={(event) => event.preventDefault()}
        title={isEditing ? 'E-book 수정' : '신규 E-book 등록'}
      >
        <p className="blog-form__error" role={loadError ? 'alert' : 'status'}>
          {loadError || 'E-book 정보를 불러오는 중입니다.'}
        </p>
      </AdminFormLayout>
    )
  }

  return (
    <AdminFormLayout
      actions={
        <>
          <Link
            className="admin-form__button admin-form__button--outline"
            to="/ebook"
          >
            목록으로
          </Link>
          <div className="admin-form__actions-group">
            {isEditing ? (
              <AdminDeleteDialog
                disabled={isSaving}
                isDeleting={isDeleting}
                itemLabel="E-book"
                onConfirm={handleDelete}
              />
            ) : null}
            <button
              className="admin-form__button admin-form__button--solid"
              disabled={isSaving || isDeleting}
              type="submit"
            >
              <span>
                {isSaving ? '저장 중...' : isEditing ? '수정하기' : '등록하기'}
              </span>
              <AdminIcon name="arrow-right" />
            </button>
          </div>
        </>
      }
      onSubmit={handleSubmit}
      title={isEditing ? 'E-book 수정' : '신규 E-book 등록'}
    >
      {saveError ? (
        <p className="blog-form__error" role="alert">
          {saveError}
        </p>
      ) : null}

      <label className="blog-form__field" htmlFor={`${formId}-embed-url`}>
        <span className="blog-form__label">임베드 URL</span>
        <input
          aria-describedby={
            embedUrlError ? `${formId}-embed-url-error` : undefined
          }
          aria-invalid={embedUrlError ? true : undefined}
          autoComplete="url"
          className="blog-form__control"
          id={`${formId}-embed-url`}
          name="embedUrl"
          onChange={(event) => {
            const rawValue = event.currentTarget.value
            const embedUrl = sanitizeEbookEmbedUrl(rawValue)
            updateForm('embedUrl', embedUrl)
            setEmbedUrlError(
              rawValue === embedUrl
                ? ''
                : '임베드 URL은 영문 URL만 입력할 수 있습니다.',
            )
          }}
          onInvalid={() =>
            setEmbedUrlError('영문으로 된 http 또는 https URL을 입력해주세요.')
          }
          placeholder="임베드할 E-book URL을 입력해주세요. (영문만 작성)"
          required
          type="url"
          value={form.embedUrl}
        />
        {embedUrlError ? (
          <span
            className="blog-form__error"
            id={`${formId}-embed-url-error`}
            role="alert"
          >
            {embedUrlError}
          </span>
        ) : null}
      </label>

      <label className="blog-form__field" htmlFor={`${formId}-slug`}>
        <span className="blog-form__label">Slug</span>
        <input
          aria-describedby={slugError ? `${formId}-slug-error` : undefined}
          aria-invalid={slugError ? true : undefined}
          autoComplete="off"
          className="blog-form__control"
          id={`${formId}-slug`}
          name="slug"
          onChange={(event) => {
            const rawValue = event.currentTarget.value
            const slug = sanitizeEbookSlug(rawValue)
            updateForm('slug', slug)
            setSlugError(
              rawValue === slug
                ? ''
                : 'Slug는 영문 소문자, 숫자, 하이픈만 입력할 수 있습니다.',
            )
          }}
          onInvalid={() =>
            setSlugError(
              'Slug는 영문 소문자, 숫자, 하이픈만 입력할 수 있습니다.',
            )
          }
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          placeholder="E-book Slug를 입력해주세요. (영문만 작성)"
          required
          type="text"
          value={form.slug}
        />
        {slugError ? (
          <span
            className="blog-form__error"
            id={`${formId}-slug-error`}
            role="alert"
          >
            {slugError}
          </span>
        ) : null}
      </label>

      <fieldset className="blog-form__thumbnail-field">
        <legend className="blog-form__label">OG Img</legend>
        <div className="blog-form__thumbnail-header">
          <span className="blog-form__thumbnail-label">
            <span className="blog-form__check">
              <AdminIcon name="check" />
            </span>
            <span>이미지 추가</span>
          </span>
          <label
            className="blog-form__thumbnail-alt"
            htmlFor={`${formId}-og-image-alt`}
          >
            <span className="blog-form__visually-hidden">
              OG 이미지 대체 텍스트
            </span>
            <input
              autoComplete="off"
              className="blog-form__alt-input"
              disabled={isSaving || isDeleting}
              id={`${formId}-og-image-alt`}
              name="ogImageAlt"
              onChange={(event) =>
                updateForm('ogImageAlt', event.currentTarget.value)
              }
              placeholder="IMAGE ALT TAG를 입력해주세요."
              type="text"
              value={form.ogImageAlt}
            />
          </label>
        </div>
        <input
          accept="image/png,image/jpeg,image/webp"
          aria-describedby={
            ogImageError ? `${formId}-og-image-error` : undefined
          }
          aria-invalid={ogImageError ? true : undefined}
          className="blog-form__visually-hidden"
          disabled={isSaving || isDeleting}
          id={`${formId}-og-image`}
          onChange={handleOgImageChange}
          ref={ogImageInput}
          type="file"
        />
        <div className="blog-form__thumbnail-preview-wrap">
          <button
            className={
              form.ogImagePreviewUrl
                ? 'blog-form__dropzone blog-form__dropzone--preview'
                : 'blog-form__dropzone'
            }
            disabled={isSaving || isDeleting}
            onClick={() => ogImageInput.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleOgImageDrop}
            type="button"
          >
            {form.ogImagePreviewUrl ? (
              <img
                alt={form.ogImageAlt || '선택한 OG 이미지 미리보기'}
                className="blog-form__thumbnail-preview"
                src={form.ogImagePreviewUrl}
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
          {form.ogImagePreviewUrl ? (
            <button
              aria-label={`${getEbookOgImageDisplayName(form)} 삭제`}
              className="blog-form__thumbnail-chip"
              disabled={isSaving || isDeleting}
              onClick={clearOgImage}
              type="button"
            >
              <span
                className="blog-form__thumbnail-file-name"
                title={getEbookOgImageDisplayName(form)}
              >
                {getEbookOgImageDisplayName(form)}
              </span>
              <AdminIcon name="x-close" size={20} />
            </button>
          ) : null}
        </div>
        {ogImageError ? (
          <span
            className="blog-form__error"
            id={`${formId}-og-image-error`}
            role="alert"
          >
            {ogImageError}
          </span>
        ) : null}
      </fieldset>

      <label className="blog-form__field" htmlFor={`${formId}-title`}>
        <span className="blog-form__label">Title</span>
        <input
          autoComplete="off"
          className="blog-form__control"
          id={`${formId}-title`}
          name="title"
          onChange={(event) => updateForm('title', event.currentTarget.value)}
          placeholder="E-book 제목을 입력해주세요."
          required
          type="text"
          value={form.title}
        />
      </label>

      <label className="blog-form__field" htmlFor={`${formId}-seo-description`}>
        <span className="blog-form__label">SEO Description</span>
        <textarea
          className="blog-form__textarea blog-form__textarea--seo"
          id={`${formId}-seo-description`}
          name="seoDescription"
          onChange={(event) =>
            updateForm('seoDescription', event.currentTarget.value)
          }
          placeholder="검색 결과에 표시될 E-book 설명을 입력해주세요."
          required
          value={form.seoDescription}
        />
      </label>
    </AdminFormLayout>
  )
}
