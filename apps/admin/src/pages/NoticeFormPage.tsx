import { createPost, deletePost, getAdminPost, updatePost } from '@repo/supabase'
import type { PublishStatus } from '@repo/supabase/types'
import { useEffect, useId, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AdminIcon } from '../components/AdminIcon'
import { AdminDeleteDialog } from '../components/admin-form/AdminDeleteDialog'
import { AdminFormLayout } from '../components/admin-form/AdminFormLayout'
import { AdminTypeCombobox } from '../components/admin-form/AdminTypeCombobox'
import { supabase } from '../lib/supabase'
import { getSubmitIntent } from './contentListState'
import {
  createInitialNoticeForm,
  defaultNoticeTypes,
  mergeNoticeTypes,
  normalizeNoticeType,
  toNoticeFormState,
  toNoticeMutationInput,
} from './noticeData'
import type { NoticeFormState } from './noticeData'
import './BlogFormPage.css'

const contentModes = ['html', 'text'] as const

export function NoticeFormPage() {
  const formId = useId().replaceAll(':', '')
  const navigate = useNavigate()
  const { noticeId } = useParams<{ noticeId: string }>()
  const isEditing = noticeId !== undefined
  const [form, setForm] = useState(createInitialNoticeForm)
  const [noticeTypes, setNoticeTypes] = useState<string[]>([...defaultNoticeTypes])
  const [slugError, setSlugError] = useState('')
  const [typeError, setTypeError] = useState('')
  const [isLoadingNotice, setIsLoadingNotice] = useState(isEditing)
  const [loadError, setLoadError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [typeInputKey, setTypeInputKey] = useState(0)

  useEffect(() => {
    let isCurrent = true
    const id = noticeId

    if (!id) return

    async function loadNotice(id: string) {
      setIsLoadingNotice(true)
      setLoadError('')

      try {
        const post = await getAdminPost(supabase, id, 'notice')

        if (!isCurrent) return

        setForm(toNoticeFormState(post))
        setNoticeTypes((current) => mergeNoticeTypes(current, post.type))
        setTypeInputKey((current) => current + 1)
      } catch {
        if (!isCurrent) return
        setLoadError('공지사항 정보를 불러오지 못했습니다.')
        toast.error('공지사항 정보를 불러오지 못했습니다.')
      } finally {
        if (isCurrent) setIsLoadingNotice(false)
      }
    }

    void loadNotice(id)

    return () => {
      isCurrent = false
    }
  }, [noticeId])

  function updateForm<Key extends keyof NoticeFormState>(
    key: Key,
    value: NoticeFormState[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function commitNoticeType(nextType: string) {
    const type = normalizeNoticeType(nextType)

    if (!type) return

    const existingType = noticeTypes.find(
      (noticeType) =>
        normalizeNoticeType(noticeType).toLocaleLowerCase('ko-KR') ===
        type.toLocaleLowerCase('ko-KR'),
    )

    setNoticeTypes((current) => mergeNoticeTypes(current, type))
    updateForm('type', existingType ?? type)
    setTypeError('')
  }

  function validateForm() {
    if (!form.type) {
      setTypeError('공지사항 유형을 선택해주세요.')
      window.requestAnimationFrame(() => {
        document.getElementById(formId + '-type')?.focus()
      })
      return false
    }

    if (!/^[a-z0-9-]+$/.test(form.slug)) {
      setSlugError('Slug는 영문 소문자, 숫자, 하이픈만 입력할 수 있습니다.')
      window.requestAnimationFrame(() => {
        document.getElementById(formId + '-slug')?.focus()
      })
      return false
    }

    setSlugError('')
    return true
  }

  async function persist(status: PublishStatus) {
    if (isSaving || isDeleting) return

    setIsSaving(true)
    setSaveError('')

    try {
      const input = toNoticeMutationInput(form, status)

      if (noticeId) await updatePost(supabase, noticeId, input)
      else await createPost(supabase, input)

      toast.success(status === 'draft' ? '임시저장했습니다.' : '공지사항을 저장했습니다.')
      navigate('/notices', { replace: status === 'draft' })
    } catch {
      setSaveError('공지사항을 저장하지 못했습니다. 입력값과 권한을 확인해주세요.')
      toast.error('공지사항을 저장하지 못했습니다.')
      window.alert('공지사항을 저장하지 못했습니다. 다시 시도해주세요.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!noticeId || isSaving || isDeleting) return

    setIsDeleting(true)
    setSaveError('')

    try {
      await deletePost(supabase, noticeId)
      toast.success('공지사항을 삭제했습니다.')
      navigate('/notices', { replace: true })
    } catch {
      setSaveError('공지사항을 삭제하지 못했습니다. 권한을 확인해주세요.')
      toast.error('공지사항을 삭제하지 못했습니다.')
      window.alert('공지사항을 삭제하지 못했습니다. 다시 시도해주세요.')
    } finally {
      setIsDeleting(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!validateForm()) return

    void persist(getSubmitIntent(event) === 'draft' ? 'draft' : 'published')
  }

  const pageTitle = isEditing ? '공지사항 수정' : '신규 공지사항 등록'

  if (isLoadingNotice || loadError) {
    return (
      <AdminFormLayout
        actions={
          <Link className="admin-form__button admin-form__button--outline" to="/notices">
            목록으로
          </Link>
        }
        onSubmit={(event) => event.preventDefault()}
        title={pageTitle}
      >
        <p className="blog-form__error" role={loadError ? 'alert' : 'status'}>
          {loadError || '공지사항 정보를 불러오는 중입니다.'}
        </p>
      </AdminFormLayout>
    )
  }

  return (
    <AdminFormLayout
      actions={
        <>
          <Link className="admin-form__button admin-form__button--outline" to="/notices">
            목록으로
          </Link>
          <div className="admin-form__actions-group">
            {isEditing ? (
              <AdminDeleteDialog
                disabled={isSaving}
                isDeleting={isDeleting}
                itemLabel="공지사항"
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
              value="publish"
            >
              <span>{isEditing ? '수정하기' : '등록하기'}</span>
              <AdminIcon name="arrow-right" />
            </button>
          </div>
        </>
      }
      onSubmit={handleSubmit}
      title={pageTitle}
    >
      {saveError ? (
        <p className="blog-form__error" role="alert">
          {saveError}
        </p>
      ) : null}

      <label className="blog-form__field" htmlFor={formId + '-type'}>
        <span className="blog-form__label">공지사항 유형</span>
        <AdminTypeCombobox
          allowCustomValue
          errorMessage={typeError}
          inputId={formId + '-type'}
          key={typeInputKey}
          name="type"
          onClear={() => {
            updateForm('type', '')
            setTypeError('')
          }}
          onCommit={commitNoticeType}
          options={noticeTypes}
          placeholder="공지사항 유형을 선택해주세요."
          value={form.type}
        />
        {typeError ? (
          <span className="blog-form__error" id={formId + '-type-error'} role="alert">
            {typeError}
          </span>
        ) : null}
      </label>

      <label className="blog-form__field" htmlFor={formId + '-title'}>
        <span className="blog-form__label">공지사항 제목</span>
        <input
          autoComplete="off"
          className="blog-form__control"
          id={formId + '-title'}
          name="title"
          onChange={(event) => updateForm('title', event.currentTarget.value)}
          placeholder="공지사항 제목을 입력해주세요."
          required
          type="text"
          value={form.title}
        />
      </label>

      <label className="blog-form__field" htmlFor={formId + '-slug'}>
        <span className="blog-form__label">공지사항 Slug</span>
        <input
          aria-describedby={slugError ? formId + '-slug-error' : undefined}
          aria-invalid={slugError ? true : undefined}
          autoComplete="off"
          className="blog-form__control"
          id={formId + '-slug'}
          name="slug"
          onChange={(event) => {
            const rawValue = event.currentTarget.value
            const slug = rawValue.replace(/[^a-z0-9-]/g, '')

            updateForm('slug', slug)
            setSlugError(
              rawValue === slug ? '' : '영문 소문자, 숫자, 하이픈만 입력해주세요.',
            )
          }}
          onInvalid={() =>
            setSlugError('Slug는 영문 소문자, 숫자, 하이픈만 입력할 수 있습니다.')
          }
          pattern="[a-z0-9-]+"
          placeholder="공지사항 Slug를 입력해주세요. (영문 소문자, 숫자, 하이픈)"
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
        <span className="blog-form__label">공지사항 작성일</span>
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

      <label className="blog-form__field" htmlFor={formId + '-excerpt'}>
        <span className="blog-form__label">공지사항 요약</span>
        <textarea
          className="blog-form__textarea blog-form__textarea--seo"
          id={formId + '-excerpt'}
          maxLength={180}
          name="excerpt"
          onChange={(event) => updateForm('excerpt', event.currentTarget.value)}
          placeholder="목록에 표시할 요약을 입력해주세요."
          required
          value={form.excerpt}
        />
      </label>

      <fieldset className="blog-form__content-field">
        <legend className="blog-form__label">공지사항 내용</legend>
        <div className="blog-form__mode-tabs">
          {contentModes.map((mode) => (
            <button
              aria-pressed={form.contentMode === mode}
              className={
                form.contentMode === mode
                  ? 'blog-form__mode-tab blog-form__mode-tab--active'
                  : 'blog-form__mode-tab'
              }
              key={mode}
              onClick={() => updateForm('contentMode', mode)}
              type="button"
            >
              {mode === 'html' ? 'HTML 작성' : 'TEXT Editor 작성'}
            </button>
          ))}
        </div>
        <textarea
          className="blog-form__textarea blog-form__textarea--content"
          name="content"
          onChange={(event) => updateForm('content', event.currentTarget.value)}
          placeholder="공지사항 내용을 입력해주세요."
          required
          value={form.content}
        />
      </fieldset>

      <label className="blog-form-setting">
        <input
          checked={form.isPinned}
          className="blog-form__visually-hidden"
          name="isPinned"
          onChange={(event) => updateForm('isPinned', event.currentTarget.checked)}
          type="checkbox"
        />
        <span className="blog-form-setting__content">
          <span className="blog-form-setting__label">
            <span
              className={
                form.isPinned
                  ? 'blog-form-setting__check blog-form-setting__check--checked'
                  : 'blog-form-setting__check'
              }
            >
              <AdminIcon name="check" />
            </span>
            <span>상단고정 설정</span>
          </span>
        </span>
      </label>
    </AdminFormLayout>
  )
}
