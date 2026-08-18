import {
  createPortfolioItem,
  deletePortfolioItem,
  getAdminPortfolioItem,
  listAdminPortfolioItems,
  updatePortfolioItem,
} from '@repo/supabase'
import { isProductType, productTypes } from '@repo/supabase/categories'
import { useEffect, useId, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AdminIcon } from '../components/AdminIcon'
import {
  AdminContentEditor,
} from '../components/admin-editor/AdminContentEditor'
import { getManagedContentPublishError } from '../components/admin-editor/contentEditorPublish'
import { AdminDeleteDialog } from '../components/admin-form/AdminDeleteDialog'
import { AdminFormLayout } from '../components/admin-form/AdminFormLayout'
import { AdminTypeCombobox } from '../components/admin-form/AdminTypeCombobox'
import {
  deletePublicAssets,
  getPublicAssetUrl,
  uploadPublicAsset,
} from '../lib/adminAssets'
import {
  createInitialManagedContentValue,
  managedContentIsEmpty,
  type ManagedContentFormValue,
} from '../lib/managedContent.ts'
import { removeContentAssetScope } from '../lib/contentAssetStorage'
import { supabase } from '../lib/supabase'
import { useManagedContentEditorState } from '../hooks/useManagedContentEditorState'
import { getSubmitIntent } from './contentListState'
import {
  getPortfolioSettingCounts,
  toPortfolioFormValues,
  toPortfolioListRow,
  toPortfolioMutationInput,
} from './portfolioData'
import { getPortfolioImageError, isValidPortfolioSlug } from './portfolioFormState'
import './PortfolioFormPage.css'

type PortfolioImageSlot = {
  readonly alt: string
  readonly file: File | null
  readonly fileName: string | null
  readonly id: string
  readonly path: string | null
  readonly previewUrl: string | null
}

type PortfolioFormState = ManagedContentFormValue & {
  readonly clientName: string
  readonly images: readonly PortfolioImageSlot[]
  readonly isLandingEnabled: boolean
  readonly isPinned: boolean
  readonly slug: string
  readonly title: string
  readonly type: string
}

function createInitialPortfolioForm(): PortfolioFormState {
  return {
    ...createInitialManagedContentValue(),
    clientName: '',
    images: [{ alt: '', file: null, fileName: null, id: 'image-1', path: null, previewUrl: null }],
    isLandingEnabled: false,
    isPinned: true,
    slug: '',
    title: '',
    type: '',
  }
}

type SettingRowProps = {
  readonly checked: boolean
  readonly count: string
  readonly label: string
  readonly onChange: (checked: boolean) => void
}

function SettingRow({ checked, count, label, onChange }: SettingRowProps) {
  return (
    <label className="portfolio-form-setting">
      <input
        checked={checked}
        className="portfolio-form__visually-hidden"
        onChange={(event) => onChange(event.currentTarget.checked)}
        type="checkbox"
      />
      <span className="portfolio-form-setting__content">
        <span className="portfolio-form-setting__label">
          <span
            className={
              checked
                ? 'portfolio-form-setting__check portfolio-form-setting__check--checked'
                : 'portfolio-form-setting__check'
            }
          >
            <AdminIcon name="check" />
          </span>
          <span>{label}</span>
        </span>
        <span className="portfolio-form-setting__count">{count}</span>
      </span>
    </label>
  )
}

export function PortfolioFormPage() {
  const formId = useId().replaceAll(':', '')
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({})
  const previewUrls = useRef(new Set<string>())
  const navigate = useNavigate()
  const { portfolioId } = useParams<{ portfolioId: string }>()
  const isEditing = portfolioId !== undefined
  const [form, setForm] = useState<PortfolioFormState>(createInitialPortfolioForm)
  const [imageErrors, setImageErrors] = useState<Record<string, string>>({})
  const [slugError, setSlugError] = useState('')
  const [typeError, setTypeError] = useState('')
  const [portfolioSettingCounts, setPortfolioSettingCounts] = useState({ landing: 0, pinned: 0 })
  const [storedImagePaths, setStoredImagePaths] = useState<readonly string[]>([])
  const [publishedAt, setPublishedAt] = useState<string | null>(null)
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(isEditing)
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const operationInFlight = useRef(false)
  const contentEditorDocumentKey = `portfolio:${form.contentAssetScope}`
  const contentEditorState = useManagedContentEditorState(
    contentEditorDocumentKey,
    form.contentAuthoringMode === 'wysiwyg',
  )
  const actionLocked = isSaving || isDeleting || contentEditorState.busy

  const pageTitle = isEditing ? '포트폴리오 수정' : '신규 포트폴리오 등록'
  const submitLabel = isEditing ? '수정하기' : '등록하기'

  useEffect(
    () => () => {
      previewUrls.current.forEach((url) => URL.revokeObjectURL(url))
    },
    [],
  )

  useEffect(() => {
    let isCurrent = true

    void listAdminPortfolioItems(supabase)
      .then((items) => {
        if (!isCurrent) return
        setPortfolioSettingCounts(getPortfolioSettingCounts(items.map(toPortfolioListRow)))
      })
      .catch(() => {
        if (isCurrent) toast.error('포트폴리오 설정 현황을 불러오지 못했습니다.')
      })

    return () => {
      isCurrent = false
    }
  }, [])

  useEffect(() => {
    let isCurrent = true
    const id = portfolioId

    if (!id) return

    void getAdminPortfolioItem(supabase, id)
      .then((item) => {
        if (!isCurrent) return

        const values = toPortfolioFormValues(item)
        const { images, ...fields } = values
        const imageSlots = images.map((image, index) => ({
          ...image,
          file: null,
          id: `saved-image-${index}`,
          previewUrl: getPublicAssetUrl(image.path),
        }))

        setForm({
          ...fields,
          images:
            imageSlots.length > 0
              ? imageSlots
              : [
                  {
                    alt: '',
                    file: null,
                    fileName: null,
                    id: 'image-1',
                    path: null,
                    previewUrl: null,
                  },
                ],
        })
        setStoredImagePaths(images.map((image) => image.path))
        setPublishedAt(item.published_at)
        setImageErrors({})
        setSlugError('')
        setTypeError('')
      })
      .catch(() => {
        if (!isCurrent) return
        setLoadError('포트폴리오 정보를 불러오지 못했습니다.')
        toast.error('포트폴리오 정보를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (isCurrent) setIsLoadingPortfolio(false)
      })

    return () => {
      isCurrent = false
    }
  }, [portfolioId])

  function updateForm<Key extends Exclude<keyof PortfolioFormState, 'images'>>(
    key: Key,
    value: PortfolioFormState[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function commitPortfolioType(nextPortfolioType: string) {
    if (!isProductType(nextPortfolioType)) {
      setTypeError('고정된 상품 유형 중 하나를 선택해주세요.')
      return
    }

    updateForm('type', nextPortfolioType)
    setTypeError('')
  }

  function updateImage(slotId: string, update: (slot: PortfolioImageSlot) => PortfolioImageSlot) {
    setForm((current) => ({
      ...current,
      images: current.images.map((slot) => (slot.id === slotId ? update(slot) : slot)),
    }))
  }

  function releasePreviewUrl(previewUrl: string | null) {
    if (!previewUrl || !previewUrls.current.has(previewUrl)) return

    URL.revokeObjectURL(previewUrl)
    previewUrls.current.delete(previewUrl)
  }

  function setImageFile(slotId: string, file: File | undefined) {
    if (!file) return

    const errorMessage = getPortfolioImageError(file)

    if (errorMessage) {
      setImageErrors((current) => ({ ...current, [slotId]: errorMessage }))
      return
    }

    releasePreviewUrl(form.images.find((slot) => slot.id === slotId)?.previewUrl ?? null)

    const previewUrl = URL.createObjectURL(file)

    previewUrls.current.add(previewUrl)
    updateImage(slotId, (slot) => ({
      ...slot,
      file,
      fileName: file.name,
      path: null,
      previewUrl,
    }))
    setImageErrors((current) => {
      const nextErrors = { ...current }

      delete nextErrors[slotId]
      return nextErrors
    })
  }

  function clearImage(slotId: string) {
    releasePreviewUrl(form.images.find((slot) => slot.id === slotId)?.previewUrl ?? null)
    updateImage(slotId, (slot) => ({
      ...slot,
      file: null,
      fileName: null,
      path: null,
      previewUrl: null,
    }))

    const fileInput = fileInputs.current[slotId]

    if (fileInput) fileInput.value = ''
  }

  function addImageSlot() {
    setForm((current) => ({
      ...current,
      images: [
        ...current.images,
        {
          alt: '',
          file: null,
          fileName: null,
          id: crypto.randomUUID(),
          path: null,
          previewUrl: null,
        },
      ],
    }))
  }

  function removeImageSlot(slotId: string) {
    releasePreviewUrl(form.images.find((slot) => slot.id === slotId)?.previewUrl ?? null)
    setForm((current) => ({
      ...current,
      images: current.images.filter((slot) => slot.id !== slotId),
    }))
    setImageErrors((current) => {
      const nextErrors = { ...current }

      delete nextErrors[slotId]
      return nextErrors
    })
  }

  function handleFileChange(slotId: string, event: ChangeEvent<HTMLInputElement>) {
    setImageFile(slotId, event.currentTarget.files?.[0])
  }

  function handleFileDrop(slotId: string, event: DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    setImageFile(slotId, event.dataTransfer.files[0])
  }

  async function persist(status: 'draft' | 'published') {
    if (actionLocked || operationInFlight.current) return

    if (
      status === 'published' &&
      !form.images.some((slot) => Boolean(slot.file || slot.path))
    ) {
      const message = '게시할 포트폴리오 이미지를 한 장 이상 등록해주세요.'

      setSaveError(message)
      toast.error(message)
      window.alert(message)
      return
    }

    operationInFlight.current = true

    setIsSaving(true)
    setSaveError('')
    const uploadedPaths: string[] = []
    let didPersist = false

    try {
      const images = []

      for (const slot of form.images) {
        let path = slot.path

        if (slot.file) {
          path = await uploadPublicAsset('portfolio', slot.file)
          uploadedPaths.push(path)
        }

        if (path) {
          images.push({
            alt: slot.alt,
            fileName: slot.file?.name ?? slot.fileName ?? path.split('/').pop() ?? 'image',
            path,
          })
        }
      }

      const nextPublishedAt =
        status === 'published' ? publishedAt || new Date().toISOString() : null
      const input = toPortfolioMutationInput(form, images, status, nextPublishedAt)

      if (portfolioId) {
        await updatePortfolioItem(supabase, portfolioId, input)
      } else {
        await createPortfolioItem(supabase, input)
      }

      didPersist = true
      const retainedPaths = new Set(images.map((image) => image.path))
      const stalePaths = storedImagePaths.filter((path) => !retainedPaths.has(path))

      try {
        await deletePublicAssets(stalePaths)
      } catch {
        toast.error('포트폴리오는 저장됐지만 이전 이미지를 정리하지 못했습니다.')
        window.alert('포트폴리오는 저장됐지만 이전 이미지를 정리하지 못했습니다.')
      }

      toast.success(status === 'draft' ? '임시저장했습니다.' : '포트폴리오를 저장했습니다.')
      navigate('/portfolio', { replace: status === 'draft' })
    } catch {
      if (!didPersist) {
        await deletePublicAssets(uploadedPaths).catch(() => undefined)
      }
      setSaveError('포트폴리오를 저장하지 못했습니다. 입력값과 권한을 확인해주세요.')
      toast.error('포트폴리오를 저장하지 못했습니다.')
      window.alert('포트폴리오를 저장하지 못했습니다. 다시 시도해주세요.')
    } finally {
      operationInFlight.current = false
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!portfolioId || actionLocked || operationInFlight.current) return

    operationInFlight.current = true

    setIsDeleting(true)
    setSaveError('')

    try {
      await deletePortfolioItem(supabase, portfolioId)

      try {
        await removeContentAssetScope('portfolio', form.contentAssetScope)
      } catch {
        toast.error('본문 이미지 파일을 정리하지 못했습니다.')
        window.alert('포트폴리오는 삭제됐지만 본문 이미지 파일을 정리하지 못했습니다.')
      }

      try {
        await deletePublicAssets(storedImagePaths)
      } catch {
        toast.error('포트폴리오는 삭제됐지만 이미지를 정리하지 못했습니다.')
        window.alert('포트폴리오는 삭제됐지만 이미지를 정리하지 못했습니다.')
      }

      toast.success('포트폴리오를 삭제했습니다.')
      navigate('/portfolio', { replace: true })
    } catch {
      setSaveError('포트폴리오를 삭제하지 못했습니다. 권한을 확인해주세요.')
      toast.error('포트폴리오를 삭제하지 못했습니다.')
      window.alert('포트폴리오를 삭제하지 못했습니다. 다시 시도해주세요.')
    } finally {
      operationInFlight.current = false
      setIsDeleting(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isProductType(form.type)) {
      setTypeError('포트폴리오 유형을 선택해주세요.')
      window.requestAnimationFrame(() => {
        document.getElementById(formId + '-type')?.focus()
      })
      return
    }

    if (!isValidPortfolioSlug(form.slug)) {
      setSlugError('Slug는 영문 소문자, 숫자, 하이픈만 입력할 수 있습니다.')
      window.requestAnimationFrame(() => {
        document.getElementById(formId + '-slug')?.focus()
      })
      return
    }

    setSlugError('')
    const status = getSubmitIntent(event) === 'draft' ? 'draft' : 'published'
    if (managedContentIsEmpty(form)) {
      setSaveError('포트폴리오 내용을 입력해주세요.')
      focusContentEditor()
      return
    }
    if (status === 'published') {
      const contentError = getManagedContentPublishError(
        'portfolio',
        form,
        contentEditorState.pendingAssetCount,
      )
      if (contentError) {
        setSaveError(contentError)
        focusContentEditor()
        return
      }
    }
    void persist(status)
  }

  function focusContentEditor() {
    window.requestAnimationFrame(() => {
      const editor = document.getElementById(`${formId}-content-editor`)
      editor?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      editor?.focus()
    })
  }

  if (isLoadingPortfolio || loadError) {
    return (
      <AdminFormLayout
        actions={
          <Link
            aria-disabled={actionLocked || undefined}
            className="admin-form__button admin-form__button--outline"
            onClick={(event) => {
              if (actionLocked) event.preventDefault()
            }}
            tabIndex={actionLocked ? -1 : undefined}
            to="/portfolio"
          >
            목록으로
          </Link>
        }
        onSubmit={(event) => event.preventDefault()}
        title={pageTitle}
      >
        <p className="portfolio-form__error" role={loadError ? 'alert' : 'status'}>
          {loadError || '포트폴리오 정보를 불러오는 중입니다.'}
        </p>
      </AdminFormLayout>
    )
  }

  return (
    <AdminFormLayout
      actions={
        <>
          <Link
            aria-disabled={actionLocked || undefined}
            className="admin-form__button admin-form__button--outline"
            onClick={(event) => {
              if (actionLocked) event.preventDefault()
            }}
            tabIndex={actionLocked ? -1 : undefined}
            to="/portfolio"
          >
            목록으로
          </Link>
          <div className="admin-form__actions-group">
            {isEditing ? (
              <AdminDeleteDialog
                disabled={actionLocked}
                isDeleting={isDeleting}
                itemLabel="포트폴리오"
                onConfirm={handleDelete}
              />
            ) : null}
            <button
              className="admin-form__button admin-form__button--outline"
              disabled={actionLocked}
              name="intent"
              type="submit"
              value="draft"
            >
              임시저장
            </button>
            <button
              className="admin-form__button admin-form__button--solid"
              disabled={actionLocked}
              name="intent"
              type="submit"
              value="publish"
            >
              <span>{isSaving ? '저장 중' : submitLabel}</span>
              <AdminIcon name="arrow-right" />
            </button>
          </div>
        </>
      }
      onSubmit={handleSubmit}
      title={pageTitle}
    >
      {saveError ? (
        <p className="portfolio-form__error" role="alert">
          {saveError}
        </p>
      ) : null}
      <label className="portfolio-form__field" htmlFor={formId + '-type'}>
        <span className="portfolio-form__label">포트폴리오 유형</span>
        <AdminTypeCombobox
          errorMessage={typeError}
          inputId={formId + '-type'}
          name="type"
          onClear={() => {
            updateForm('type', '')
            setTypeError('')
          }}
          onCommit={commitPortfolioType}
          options={productTypes}
          placeholder="포트폴리오 유형을 선택해주세요."
          value={form.type}
        />
        {typeError ? (
          <span className="portfolio-form__error" id={formId + '-type-error'} role="alert">
            {typeError}
          </span>
        ) : null}
      </label>

      <label className="portfolio-form__field" htmlFor={formId + '-title'}>
        <span className="portfolio-form__label">포트폴리오 제목</span>
        <input
          autoComplete="off"
          className="portfolio-form__control"
          id={formId + '-title'}
          name="title"
          onChange={(event) => updateForm('title', event.currentTarget.value)}
          placeholder="포트폴리오 제목을 입력해주세요."
          required
          type="text"
          value={form.title}
        />
      </label>

      <label className="portfolio-form__field" htmlFor={formId + '-slug'}>
        <span className="portfolio-form__label">포트폴리오 Slug</span>
        <input
          aria-describedby={slugError ? formId + '-slug-error' : undefined}
          aria-invalid={slugError ? true : undefined}
          autoComplete="off"
          className="portfolio-form__control"
          id={formId + '-slug'}
          name="slug"
          onChange={(event) => {
            const value = event.currentTarget.value
            const slug = value.toLowerCase().replace(/[^a-z0-9-]/g, '')

            updateForm('slug', slug)
            setSlugError(
              value === slug ? '' : '영문 소문자, 숫자, 하이픈만 입력해주세요.',
            )
          }}
          onInvalid={() =>
            setSlugError('Slug는 영문 소문자, 숫자, 하이픈만 입력할 수 있습니다.')
          }
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          placeholder="포트폴리오 Slug를 입력해주세요. (영문 소문자, 숫자, 하이픈)"
          required
          type="text"
          value={form.slug}
        />
        {slugError ? (
          <span className="portfolio-form__error" id={formId + '-slug-error'} role="alert">
            {slugError}
          </span>
        ) : null}
      </label>

      <label className="portfolio-form__field" htmlFor={formId + '-client'}>
        <span className="portfolio-form__label">기업명</span>
        <input
          autoComplete="organization"
          className="portfolio-form__control"
          id={formId + '-client'}
          name="clientName"
          onChange={(event) => updateForm('clientName', event.currentTarget.value)}
          placeholder="기업명을 입력해주세요."
          required
          type="text"
          value={form.clientName}
        />
      </label>

      <fieldset className="portfolio-form__image-field">
        <legend className="portfolio-form__label">이미지</legend>
        <div className="portfolio-form__image-list">
          {form.images.map((slot) => {
            const inputId = formId + '-' + slot.id
            const errorMessage = imageErrors[slot.id]
            const imageFileName =
              slot.file?.name ?? slot.fileName ?? slot.path?.split('/').pop() ?? '선택한 이미지'
            const uploadCopy = '파일을 드래그 또는 클릭 후 파일 업로드 (0/1)'

            return (
              <div className="portfolio-form__image-slot" key={slot.id}>
                <div className="portfolio-form__image-header">
                  <button
                    aria-label="이미지 슬롯 삭제"
                    className="portfolio-form__image-title"
                    onClick={() => removeImageSlot(slot.id)}
                    type="button"
                  >
                    <span className="portfolio-form__image-check">
                      <AdminIcon name="check" />
                    </span>
                    <span>이미지 추가</span>
                  </button>
                  <label className="portfolio-form__alt-label" htmlFor={inputId + '-alt'}>
                    <span className="portfolio-form__visually-hidden">이미지 대체 텍스트</span>
                    <input
                      autoComplete="off"
                      className="portfolio-form__alt-input"
                      id={inputId + '-alt'}
                      onChange={(event) => {
                        const alt = event.currentTarget.value

                        updateImage(slot.id, (current) => ({ ...current, alt }))
                      }}
                      placeholder="IMAGE ALT TAG를 입력해주세요."
                      type="text"
                      value={slot.alt}
                    />
                  </label>
                </div>
                <input
                  accept="image/png,image/jpeg,image/webp"
                  aria-describedby={errorMessage ? inputId + '-error' : undefined}
                  aria-invalid={errorMessage ? true : undefined}
                  className="portfolio-form__visually-hidden"
                  id={inputId}
                  multiple={false}
                  onChange={(event) => handleFileChange(slot.id, event)}
                  ref={(element) => {
                    fileInputs.current[slot.id] = element
                  }}
                  type="file"
                />
                <div className="portfolio-form__image-preview-wrap">
                  <button
                    className={
                      slot.previewUrl
                        ? 'portfolio-form__dropzone portfolio-form__dropzone--preview'
                        : 'portfolio-form__dropzone'
                    }
                    onClick={() => fileInputs.current[slot.id]?.click()}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => handleFileDrop(slot.id, event)}
                    type="button"
                  >
                    {slot.previewUrl ? (
                      <img
                        alt={slot.alt || '선택한 이미지 미리보기'}
                        className="portfolio-form__image-preview"
                        src={slot.previewUrl}
                      />
                    ) : (
                      <>
                        <AdminIcon name="folder-up" size={20} />
                        <span className="portfolio-form__dropzone-copy">
                          <span>{uploadCopy}</span>
                          <span>PNG, JPEG, WEBP 등 / 최대 50MB 제한</span>
                        </span>
                      </>
                    )}
                  </button>

                  {slot.previewUrl ? (
                    <div className="portfolio-form__image-file-chip">
                      <span className="portfolio-form__image-file-name" title={imageFileName}>
                        {imageFileName}
                      </span>
                      <button
                        aria-label={`${imageFileName} 삭제`}
                        className="portfolio-form__image-file-remove"
                        onClick={() => clearImage(slot.id)}
                        type="button"
                      >
                        <AdminIcon name="x-close" size={20} />
                      </button>
                    </div>
                  ) : null}
                </div>
                {errorMessage ? (
                  <span className="portfolio-form__error" id={inputId + '-error'} role="alert">
                    {errorMessage}
                  </span>
                ) : null}
              </div>
            )
          })}

          <div className="portfolio-form__image-add-row">
            <button className="portfolio-form__image-add" onClick={addImageSlot} type="button">
              <span className="portfolio-form__image-check portfolio-form__image-check--muted">
                <AdminIcon name="check" />
              </span>
              <span>이미지 추가</span>
            </button>
            <input
              aria-label="다음 이미지 대체 텍스트"
              className="portfolio-form__alt-input portfolio-form__alt-input--disabled"
              disabled
              placeholder="IMAGE ALT TAG를 입력해주세요."
              type="text"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="portfolio-form__content-field">
        <legend className="portfolio-form__label">포트폴리오 내용</legend>
        <AdminContentEditor
          disabled={isSaving || isDeleting}
          documentKey={contentEditorDocumentKey}
          entity="portfolio"
          id={`${formId}-content-editor`}
          key={contentEditorDocumentKey}
          onBusyChange={contentEditorState.onBusyChange}
          onChange={(value) => setForm((current) => ({ ...current, ...value }))}
          onPendingAssetCountChange={contentEditorState.onPendingAssetCountChange}
          placeholder="포트폴리오 내용을 입력해주세요."
          value={form}
        />
      </fieldset>

      <div className="portfolio-form__settings">
        <SettingRow
          checked={form.isLandingEnabled}
          count={`${portfolioSettingCounts.landing}개 등록됨`}
          label="랜딩 설정"
          onChange={(isLandingEnabled) => updateForm('isLandingEnabled', isLandingEnabled)}
        />
        <SettingRow
          checked={form.isPinned}
          count={`${portfolioSettingCounts.pinned}개 등록됨`}
          label="상단고정 설정"
          onChange={(isPinned) => updateForm('isPinned', isPinned)}
        />
      </div>
    </AdminFormLayout>
  )
}
