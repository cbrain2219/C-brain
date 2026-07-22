import {
  createReview,
  deleteReview,
  getAdminReview,
  updateReview,
} from '@repo/supabase'
import { useEffect, useId, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, FormEvent, RefObject } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AdminIcon } from '../components/AdminIcon'
import { AdminDeleteDialog } from '../components/admin-form/AdminDeleteDialog'
import { AdminFormLayout } from '../components/admin-form/AdminFormLayout'
import { AdminTypeCombobox } from '../components/admin-form/AdminTypeCombobox'
import {
  deletePublicAssets,
  getPublicAssetUrl,
  uploadPublicAsset,
} from '../lib/adminAssets'
import { supabase } from '../lib/supabase'
import { getSubmitIntent } from './contentListState'
import {
  createInitialReviewForm,
  toReviewFormState,
  toReviewMutationInput,
} from './reviewData'
import type {
  ReviewContentMode,
  ReviewFormState,
} from './reviewData'
import {
  getReviewVideoError,
  isReviewType,
  isValidInterviewSlug,
  reviewTypes,
} from './reviewFormState'
import type { ReviewType } from './reviewFormState'
import './BlogFormPage.css'
import './ReviewFormPage.css'

const contentModes = ['html', 'text'] as const

type UpdateReviewForm = <Key extends keyof ReviewFormState>(
  key: Key,
  value: ReviewFormState[Key],
) => void

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

type DateFieldProps = {
  readonly id: string
  readonly label: string
  readonly onChange: (value: string) => void
  readonly value: string
}

function DateField({ id, label, onChange, value }: DateFieldProps) {
  return (
    <label className="blog-form__field" htmlFor={id}>
      <span className="blog-form__label">{label}</span>
      <input
        className="blog-form__control blog-form__control--date"
        id={id}
        name="publishedAt"
        onChange={(event) => onChange(event.currentTarget.value)}
        onPointerDown={(event) => {
          if (!event.currentTarget.showPicker) return

          event.preventDefault()
          event.currentTarget.showPicker()
        }}
        required
        type="date"
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
        {contentModes.map((contentMode) => (
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
        aria-label={`${type} 내용`}
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

type VideoFieldProps = {
  readonly errorMessage: string
  readonly inputId: string
  readonly inputRef: RefObject<HTMLInputElement | null>
  readonly onAltChange: (value: string) => void
  readonly onClear: () => void
  readonly onDrop: (event: DragEvent<HTMLButtonElement>) => void
  readonly onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  readonly video: File | null
  readonly videoAlt: string
  readonly videoPreviewUrl: string | null
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
  videoPreviewUrl,
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
        name="video"
        onChange={onFileChange}
        ref={inputRef}
        tabIndex={-1}
        type="file"
      />
      <div className="blog-form__thumbnail-preview-wrap">
        <button
          aria-describedby={errorMessage ? errorId : undefined}
          aria-invalid={errorMessage ? true : undefined}
          aria-label={videoPreviewUrl ? '선택한 인터뷰 영상 변경' : undefined}
          className={
            videoPreviewUrl
              ? 'blog-form__dropzone review-form__video-dropzone review-form__video-dropzone--preview'
              : 'blog-form__dropzone review-form__video-dropzone'
          }
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={onDrop}
          type="button"
        >
          {videoPreviewUrl ? (
            <video
              aria-label={videoAlt || '선택한 인터뷰 영상 미리보기'}
              className="review-form__video-preview"
              muted
              playsInline
              preload="metadata"
              src={videoPreviewUrl}
            />
          ) : (
            <>
              <span className="blog-form__folder-icon">
                <AdminIcon name="folder-up" size={20} />
              </span>
              <span className="blog-form__dropzone-copy">
                <span>파일을 드래그 또는 클릭 후 파일 업로드 (0/1)</span>
                <span>MP4, MOV 등 / 최대 500MB 제한</span>
              </span>
            </>
          )}
        </button>
        {videoPreviewUrl ? (
          <button
            aria-label={`${video?.name ?? '등록된 영상'} 삭제`}
            className="blog-form__thumbnail-chip"
            onClick={onClear}
            type="button"
          >
            <span
              className="blog-form__thumbnail-file-name"
              title={video?.name ?? '등록된 영상'}
            >
              {video?.name ?? '등록된 영상'}
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
        <span className="blog-form-setting__count">
          {checked ? '랜딩에 게시됨' : '랜딩 미게시'}
        </span>
      </span>
    </label>
  )
}

type InterviewFieldsProps = {
  readonly form: ReviewFormState
  readonly formId: string
  readonly onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  readonly onFileDrop: (event: DragEvent<HTMLButtonElement>) => void
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
          <span
            className="blog-form__error"
            id={`${formId}-slug-error`}
            role="alert"
          >
            {slugError}
          </span>
        ) : null}
      </label>
      <DateField
        id={`${formId}-published-at`}
        label="인터뷰 작성일"
        onChange={(value) => onUpdate('publishedAt', value)}
        value={form.publishedAt}
      />
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
        videoPreviewUrl={form.videoPreviewUrl}
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
          onChange={(event) =>
            onUpdate('seoDescription', event.currentTarget.value)
          }
          placeholder="SEO Description을 입력해주세요."
          value={form.seoDescription}
        />
      </label>
    </>
  )
}

type CustomerReviewFieldsProps = {
  readonly form: ReviewFormState
  readonly formId: string
  readonly onUpdate: UpdateReviewForm
}

function CustomerReviewFields({
  form,
  formId,
  onUpdate,
}: CustomerReviewFieldsProps) {
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
      <DateField
        id={`${formId}-published-at`}
        label="후기 작성일"
        onChange={(value) => onUpdate('publishedAt', value)}
        value={form.publishedAt}
      />
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

export function ReviewFormPage() {
  const formId = useId().replaceAll(':', '')
  const videoInput = useRef<HTMLInputElement | null>(null)
  const videoPreviewUrl = useRef<string | null>(null)
  const navigate = useNavigate()
  const { reviewId } = useParams<{ reviewId: string }>()
  const isEditing = reviewId !== undefined
  const [form, setForm] = useState<ReviewFormState>(createInitialReviewForm)
  const [slugError, setSlugError] = useState('')
  const [typeError, setTypeError] = useState('')
  const [videoError, setVideoError] = useState('')
  const [isLoadingReview, setIsLoadingReview] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [originalVideoPath, setOriginalVideoPath] = useState<string | null>(null)
  const [typeInputKey, setTypeInputKey] = useState(0)

  const pageTitle = isEditing
    ? `${form.type || '인터뷰 · 후기'} 수정`
    : '신규 인터뷰 · 후기 등록'
  const submitLabel = isEditing ? '수정하기' : '등록하기'

  useEffect(
    () => () => {
      if (videoPreviewUrl.current) URL.revokeObjectURL(videoPreviewUrl.current)
    },
    [],
  )

  useEffect(() => {
    let isCurrent = true
    const id = reviewId

    if (!id) return

    async function loadReview(id: string) {
      setIsLoadingReview(true)
      setLoadError('')

      try {
        const review = await getAdminReview(supabase, id)

        if (!isCurrent) return

        if (videoPreviewUrl.current) {
          URL.revokeObjectURL(videoPreviewUrl.current)
          videoPreviewUrl.current = null
        }

        setForm(toReviewFormState(review, getPublicAssetUrl(review.video_path)))
        setOriginalVideoPath(review.video_path)
        setSlugError('')
        setTypeError('')
        setVideoError('')
        setTypeInputKey((current) => current + 1)
      } catch {
        if (!isCurrent) return
        setLoadError('인터뷰 · 후기 정보를 불러오지 못했습니다.')
        toast.error('인터뷰 · 후기 정보를 불러오지 못했습니다.')
      } finally {
        if (isCurrent) setIsLoadingReview(false)
      }
    }

    void loadReview(id)

    return () => {
      isCurrent = false
    }
  }, [reviewId])

  function updateForm<Key extends keyof ReviewFormState>(
    key: Key,
    value: ReviewFormState[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function releaseVideoPreview() {
    if (!videoPreviewUrl.current) return

    URL.revokeObjectURL(videoPreviewUrl.current)
    videoPreviewUrl.current = null
  }

  function setVideo(file: File | undefined) {
    if (!file) return

    const errorMessage = getReviewVideoError(file)

    if (errorMessage) {
      setVideoError(errorMessage)
      if (videoInput.current) videoInput.current.value = ''
      return
    }

    releaseVideoPreview()

    const previewUrl = URL.createObjectURL(file)

    videoPreviewUrl.current = previewUrl
    setForm((current) => ({
      ...current,
      video: file,
      videoPreviewUrl: previewUrl,
    }))
    setVideoError('')
  }

  function clearVideo() {
    releaseVideoPreview()
    setForm((current) => ({
      ...current,
      video: null,
      videoPath: null,
      videoPreviewUrl: null,
    }))
    setVideoError('')
    if (videoInput.current) videoInput.current.value = ''
  }

  async function persist(status: 'draft' | 'published') {
    if (isSaving || isDeleting) return

    setIsSaving(true)
    setSaveError('')

    let uploadedPath: string | null = null

    try {
      toReviewMutationInput(form, status, form.videoPath)

      if (form.type === '인터뷰' && form.video) {
        uploadedPath = await uploadPublicAsset('reviews', form.video)
      }

      const nextVideoPath =
        form.type === '인터뷰' ? uploadedPath ?? form.videoPath : null
      const input = toReviewMutationInput(form, status, nextVideoPath)

      if (reviewId) await updateReview(supabase, reviewId, input)
      else await createReview(supabase, input)

      if (originalVideoPath && originalVideoPath !== nextVideoPath) {
        try {
          await deletePublicAssets([originalVideoPath])
        } catch {
          toast.error('기존 영상 파일을 정리하지 못했습니다.')
          window.alert('리뷰는 저장했지만 기존 영상 파일을 정리하지 못했습니다.')
        }
      }

      toast.success(status === 'draft' ? '임시저장했습니다.' : '인터뷰 · 후기를 저장했습니다.')
      navigate('/reviews', { replace: status === 'draft' })
    } catch (error) {
      if (uploadedPath) {
        try {
          await deletePublicAssets([uploadedPath])
        } catch {
          // The failed save remains the actionable error; orphan cleanup can be retried in Storage.
        }
      }

      const message = error instanceof Error ? error.message : '저장하지 못했습니다.'

      setSaveError(message)
      toast.error('인터뷰 · 후기를 저장하지 못했습니다.')
      window.alert('인터뷰 · 후기를 저장하지 못했습니다. 입력값과 권한을 확인해주세요.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!reviewId || isSaving || isDeleting) return

    setIsDeleting(true)
    setSaveError('')

    try {
      await deleteReview(supabase, reviewId)

      if (originalVideoPath) {
        try {
          await deletePublicAssets([originalVideoPath])
        } catch {
          toast.error('영상 파일을 정리하지 못했습니다.')
          window.alert('리뷰는 삭제했지만 영상 파일을 정리하지 못했습니다.')
        }
      }

      toast.success('인터뷰 · 후기를 삭제했습니다.')
      navigate('/reviews', { replace: true })
    } catch {
      setSaveError('인터뷰 · 후기를 삭제하지 못했습니다.')
      toast.error('인터뷰 · 후기를 삭제하지 못했습니다.')
      window.alert('인터뷰 · 후기를 삭제하지 못했습니다. 다시 시도해주세요.')
    } finally {
      setIsDeleting(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const intent = getSubmitIntent(event)

    if (!form.type) {
      setTypeError('인터뷰 · 후기 유형을 선택해주세요.')
      window.requestAnimationFrame(() => {
        document.getElementById(`${formId}-type`)?.focus()
      })
      return
    }

    if (
      intent !== 'draft' &&
      form.type === '인터뷰' &&
      !isValidInterviewSlug(form.slug)
    ) {
      setSlugError('Slug는 영문과 하이픈만 입력할 수 있습니다.')
      window.requestAnimationFrame(() => {
        document.getElementById(`${formId}-slug`)?.focus()
      })
      return
    }

    setSlugError('')
    void persist(intent === 'draft' ? 'draft' : 'published')
  }

  if (isLoadingReview || loadError) {
    return (
      <AdminFormLayout
        actions={
          <Link className="admin-form__button admin-form__button--outline" to="/reviews">
            목록으로
          </Link>
        }
        onSubmit={(event) => event.preventDefault()}
        title={pageTitle}
      >
        <p className="blog-form__error" role={loadError ? 'alert' : 'status'}>
          {loadError || '인터뷰 · 후기 정보를 불러오는 중입니다.'}
        </p>
      </AdminFormLayout>
    )
  }

  const actions = (
    <>
      <Link
        className="admin-form__button admin-form__button--outline"
        to="/reviews"
      >
        목록으로
      </Link>
      <div className="admin-form__actions-group">
        {isEditing ? (
          <AdminDeleteDialog
            disabled={isSaving}
            isDeleting={isDeleting}
            itemLabel="인터뷰 · 후기"
            onConfirm={handleDelete}
          />
        ) : null}
        <button
          className="admin-form__button admin-form__button--outline"
          disabled={isSaving || isDeleting}
          formNoValidate
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
          <span>{submitLabel}</span>
          <AdminIcon name="arrow-right" />
        </button>
      </div>
    </>
  )

  return (
    <AdminFormLayout
      actions={actions}
      onSubmit={handleSubmit}
      title={pageTitle}
    >
      {saveError ? (
        <p className="blog-form__error" role="alert">
          {saveError}
        </p>
      ) : null}
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
          onInvalid={() => setTypeError('인터뷰 · 후기 유형을 선택해주세요.')}
          options={reviewTypes}
          placeholder="인터뷰 · 후기 유형을 선택해주세요."
          readOnly
          key={typeInputKey}
          value={form.type}
        />
        {typeError ? (
          <span
            className="blog-form__error"
            id={`${formId}-type-error`}
            role="alert"
          >
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
        <CustomerReviewFields
          form={form}
          formId={formId}
          onUpdate={updateForm}
        />
      ) : null}
    </AdminFormLayout>
  )
}
