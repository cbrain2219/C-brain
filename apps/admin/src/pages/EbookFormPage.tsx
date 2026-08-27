import {
  createEbook,
  deleteEbook,
  getAdminEbook,
  updateEbook,
} from '@repo/supabase'
import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AdminIcon } from '../components/AdminIcon'
import { AdminDeleteDialog } from '../components/admin-form/AdminDeleteDialog'
import { AdminFormLayout } from '../components/admin-form/AdminFormLayout'
import { supabase } from '../lib/supabase'
import {
  createInitialEbookForm,
  isValidEbookSlug,
  isValidEbookUrl,
  sanitizeEbookEmbedUrl,
  sanitizeEbookSlug,
  toEbookFormState,
  toEbookMutationInput,
} from './ebookData'
import type { EbookFormState } from './ebookData'
import './BlogFormPage.css'

export function EbookFormPage() {
  const formId = useId().replaceAll(':', '')
  const navigate = useNavigate()
  const { ebookId } = useParams<{ ebookId: string }>()
  const isEditing = ebookId !== undefined
  const [form, setForm] = useState(createInitialEbookForm)
  const [embedUrlError, setEmbedUrlError] = useState('')
  const [slugError, setSlugError] = useState('')
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

        setForm(toEbookFormState(ebook))
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
      hasValidUrl
        ? ''
        : '영문으로 된 http 또는 https URL을 입력해주세요.',
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (operationInFlight.current || !validateForm()) return

    operationInFlight.current = true
    setIsSaving(true)
    setSaveError('')

    try {
      const input = toEbookMutationInput(form)

      if (ebookId) await updateEbook(supabase, ebookId, input)
      else await createEbook(supabase, input)

      toast.success(
        isEditing ? 'E-book을 수정했습니다.' : 'E-book을 등록했습니다.',
      )
      navigate('/ebook')
    } catch {
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
            setEmbedUrlError(
              '영문으로 된 http 또는 https URL을 입력해주세요.',
            )
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
