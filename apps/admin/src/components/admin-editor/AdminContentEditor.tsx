import type { ContentEntity } from '@repo/content/types'
import { Component, lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ComponentType } from 'react'
import {
  isContentImagePublicUrlOwnedBy,
  removeContentAsset,
  uploadContentAsset,
} from '../../lib/contentAssetStorage'
import {
  convertLegacyTextToRaw,
  convertLegacyTextToWysiwyg,
  managedContentSchemaErrorMessage,
  switchRawToWysiwyg,
  switchWysiwygToRaw,
  type ManagedContentFormValue,
} from '../../lib/managedContent'
import {
  GenerationPendingAssetRegistry,
} from './generationPendingAssetRegistry'
import type { AdminRichTextEditorProps } from './AdminRichTextEditor'
import type { AdminRichTextCanonicalValue } from './managedEditorDocument'
import styles from './AdminContentEditor.module.css'

const LazyAdminRichTextEditor = lazy(async () => {
  const module = await import('./AdminRichTextEditor')
  return { default: module.AdminRichTextEditor as ComponentType<AdminRichTextEditorProps> }
})

class LocalEditorErrorBoundary extends Component<{
  readonly children: React.ReactNode
  readonly onError: () => void
}> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch() {
    this.props.onError()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.loading} role="alert">
          TEXT Editor를 불러오지 못했습니다. HTML 작성으로 복구할 수 있습니다.
        </div>
      )
    }

    return this.props.children
  }
}

export type AdminContentEditorProps = {
  readonly disabled?: boolean
  readonly documentKey: string
  readonly entity: ContentEntity
  readonly id?: string
  readonly onBusyChange: (busy: boolean) => void
  readonly onChange: (value: ManagedContentFormValue) => void
  readonly onPendingAssetCountChange: (count: number) => void
  readonly placeholder?: string
  readonly value: ManagedContentFormValue
}

type CommittedEditor = {
  readonly active: boolean
  readonly documentKey: string
  readonly editorGeneration: string
  readonly onBusyChange: AdminContentEditorProps['onBusyChange']
  readonly onChange: AdminContentEditorProps['onChange']
  readonly onPendingAssetCountChange: AdminContentEditorProps['onPendingAssetCountChange']
  readonly token: number
  readonly value: ManagedContentFormValue
  readonly visit: number
}

function normalizeError(error: unknown): string {
  if (error instanceof Error && error.message === managedContentSchemaErrorMessage) return error.message
  return managedContentSchemaErrorMessage
}

/**
 * The only admin body editor shell. It keeps authoring mode transitions
 * lossless and gives the parent a generation-scoped action lock.
 */
export function AdminContentEditor({
  disabled = false,
  documentKey,
  entity,
  id,
  onBusyChange,
  onChange,
  onPendingAssetCountChange,
  placeholder = '내용을 입력해주세요.',
  value,
}: AdminContentEditorProps) {
  const registry = useMemo(() => new GenerationPendingAssetRegistry(), [])
  const [editorActivation, setEditorActivation] = useState(0)
  const [editorVisit, setEditorVisit] = useState(0)
  const requestedActivation = useRef(editorActivation)
  const editorGeneration = `${documentKey}:${editorVisit}:${editorActivation}`
  const committedEditor = useRef<CommittedEditor>({
    active: true,
    documentKey,
    editorGeneration,
    onBusyChange,
    onChange,
    onPendingAssetCountChange,
    token: 0,
    value,
    visit: editorVisit,
  })
  const [readyGeneration, setReadyGeneration] = useState<string | null>(null)
  const [contentError, setContentError] = useState<{
    readonly generation: string
    readonly message: string
  } | null>(null)
  const [lazyLoadErrorGeneration, setLazyLoadErrorGeneration] = useState<string | null>(null)
  const [pendingAssets, setPendingAssets] = useState({ count: 0, generation: '' })

  useLayoutEffect(() => {
    const previous = committedEditor.current
    const visit = previous.documentKey === documentKey ? editorVisit : previous.visit + 1
    const token = previous.token + 1
    const committed: CommittedEditor = {
      active: true,
      documentKey,
      editorGeneration,
      onBusyChange,
      onChange,
      onPendingAssetCountChange,
      token,
      value,
      visit,
    }

    requestedActivation.current = editorActivation
    committedEditor.current = committed
    if (visit !== editorVisit) setEditorVisit(visit)

    return () => {
      if (committedEditor.current.token === token) {
        committedEditor.current = { ...committed, active: false }
      }
    }
  }, [documentKey, editorActivation, editorGeneration, editorVisit, onBusyChange, onChange, onPendingAssetCountChange, value])

  const isWysiwyg = value.contentAuthoringMode === 'wysiwyg'
  const contentDocument = value.contentJson
  const hasMalformedDocument = isWysiwyg && contentDocument === null
  const currentContentError = contentError?.generation === editorGeneration ? contentError.message : null
  const hasLazyLoadError = lazyLoadErrorGeneration === editorGeneration
  const pendingAssetCount = pendingAssets.generation === editorGeneration ? pendingAssets.count : 0
  const isInitializing = isWysiwyg && !hasMalformedDocument && readyGeneration !== editorGeneration
  const isBusy = pendingAssetCount > 0 || (isWysiwyg && (
    hasMalformedDocument || hasLazyLoadError || isInitializing || currentContentError !== null
  ))
  const modeControlsDisabled = disabled || pendingAssetCount > 0 || (
    isWysiwyg && isInitializing && !hasLazyLoadError
  )

  useEffect(() => {
    const committed = committedEditor.current

    if (committed.active && committed.documentKey === documentKey && committed.editorGeneration === editorGeneration) {
      committed.onBusyChange(isBusy)
    }
  }, [documentKey, editorGeneration, isBusy])

  useEffect(() => {
    const committed = committedEditor.current

    if (committed.active && committed.documentKey === documentKey && committed.editorGeneration === editorGeneration) {
      committed.onPendingAssetCountChange(pendingAssetCount)
    }
  }, [documentKey, editorGeneration, pendingAssetCount])

  function changeForActiveDocument(next: ManagedContentFormValue): void {
    const committed = committedEditor.current

    if (!committed.active || committed.documentKey !== documentKey) return
    committed.onChange(next)
  }

  function isCurrentEditorCallback(generation: string): boolean {
    const committed = committedEditor.current

    return committed.active &&
      committed.documentKey === documentKey &&
      committed.editorGeneration === generation &&
      requestedActivation.current === editorActivation
  }

  function receiveCanonicalValue(next: AdminRichTextCanonicalValue): void {
    if (
      !isCurrentEditorCallback(editorGeneration) ||
      committedEditor.current.value.contentAuthoringMode !== 'wysiwyg'
    ) return
    changeForActiveDocument({
      ...committedEditor.current.value,
      content: next.html,
      contentJson: next.document,
      contentMode: 'html',
    })
  }

  function receivePendingAssetWork(event: {
    readonly count: number
    readonly generation: string
    readonly producerKey: symbol
  }): void {
    const count = registry.update(event)
    if (
      !isCurrentEditorCallback(editorGeneration) ||
      event.generation !== editorGeneration
    ) return
    setPendingAssets({ count, generation: editorGeneration })
  }

  function beginWysiwygActivation(): void {
    // A record can return to WYSIWYG without changing its record key. Give the
    // replacement editor a fresh generation so the previous instance cannot
    // satisfy readiness or unlock actions before its own onCreate callback.
    const nextActivation = requestedActivation.current + 1

    requestedActivation.current = nextActivation
    setEditorActivation(nextActivation)
    const committed = committedEditor.current
    if (committed.active && committed.documentKey === documentKey) committed.onBusyChange(true)
  }

  function switchToRaw(): void {
    if (modeControlsDisabled || !isWysiwyg) return
    changeForActiveDocument(switchWysiwygToRaw(value, 'backup'))
  }

  function switchToWysiwyg(): void {
    if (modeControlsDisabled || isWysiwyg) return
    if (value.contentMode === 'markdown') return
    beginWysiwygActivation()
    changeForActiveDocument(
      switchRawToWysiwyg(value, value.contentJson ? 'restore_previous' : 'new_from_current_backup'),
    )
  }

  return (
    <div className={styles.root} id={id} tabIndex={-1}>
      <div aria-label="본문 작성 방식" className={styles.tabs} role="group">
        <button
          aria-pressed={!isWysiwyg}
          className={styles.tab}
          data-active={!isWysiwyg || undefined}
          disabled={modeControlsDisabled}
          onClick={switchToRaw}
          type="button"
        >
          HTML 작성
        </button>
        <button
          aria-pressed={isWysiwyg}
          className={styles.tab}
          data-active={isWysiwyg || undefined}
          disabled={modeControlsDisabled}
          onClick={switchToWysiwyg}
          type="button"
        >
          TEXT Editor 작성
        </button>
      </div>

      {!isWysiwyg ? (
        <>
          {value.contentMode === 'markdown' ? (
            <div className={styles.legacyNotice} role="status">
              <span>기존 TEXT Editor 본문입니다. 변환을 선택하기 전까지 원문은 그대로 보존됩니다.</span>
              <div className={styles.legacyActions}>
                <button
                  className={styles.legacyAction}
                  disabled={modeControlsDisabled}
                  onClick={() => changeForActiveDocument(convertLegacyTextToRaw(value))}
                  type="button"
                >
                  HTML로 변환
                </button>
                <button
                  className={styles.legacyAction}
                  disabled={modeControlsDisabled}
                  onClick={() => {
                    beginWysiwygActivation()
                    changeForActiveDocument(convertLegacyTextToWysiwyg(value))
                  }}
                  type="button"
                >
                  TEXT Editor로 변환
                </button>
              </div>
            </div>
          ) : null}
          <textarea
            aria-label="본문 HTML"
            className={styles.rawTextarea}
            disabled={disabled}
            name="content"
            onChange={(event) => changeForActiveDocument({ ...value, content: event.currentTarget.value })}
            placeholder={placeholder}
            value={value.content}
          />
        </>
      ) : contentDocument === null ? (
        <div className={styles.loading} role="alert">
          {managedContentSchemaErrorMessage}
        </div>
      ) : (
        <LocalEditorErrorBoundary
          key={editorGeneration}
          onError={() => {
            if (!isCurrentEditorCallback(editorGeneration)) return
            setLazyLoadErrorGeneration(editorGeneration)
          }}
        >
          <Suspense fallback={<div className={styles.loading}>TEXT Editor를 준비하고 있습니다.</div>}>
            <LazyAdminRichTextEditor
            key={editorGeneration}
            cleanupOrphanedImage={(image, reason) =>
              removeContentAsset(entity, value.contentAssetScope, image.path).catch((error) => {
                throw new Error(reason === 'editor_replaced' ? '본문 이미지 정리에 실패했습니다.' : String(error))
              })
            }
            disabled={disabled || currentContentError !== null}
            document={contentDocument}
            documentKey={editorGeneration}
            isAllowedImageUrl={(url) => isContentImagePublicUrlOwnedBy(entity, value.contentAssetScope, url)}
            onChange={receiveCanonicalValue}
            onContentError={(error) => {
              if (!isCurrentEditorCallback(editorGeneration)) return
              setContentError({ generation: editorGeneration, message: normalizeError(error) })
            }}
            onCreate={(next) => {
              if (!isCurrentEditorCallback(editorGeneration)) return
              setReadyGeneration(editorGeneration)
              setContentError(null)
              receiveCanonicalValue(next)
            }}
            onPendingAssetWorkChange={receivePendingAssetWork}
            onUploadError={() => undefined}
            uploadImage={(file) => uploadContentAsset(entity, value.contentAssetScope, file)}
            />
          </Suspense>
        </LocalEditorErrorBoundary>
      )}

      {pendingAssetCount > 0 ? (
        <p aria-live="polite" className={styles.status} role="status">
          본문 이미지 업로드 중입니다. 완료될 때까지 저장할 수 없습니다.
        </p>
      ) : null}
      {currentContentError ? (
        <p aria-live="polite" className={styles.error} role="alert">
          {currentContentError}
        </p>
      ) : null}
    </div>
  )
}
