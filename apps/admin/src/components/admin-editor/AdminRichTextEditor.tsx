/* eslint-disable react-hooks/immutability, react-hooks/refs */
import type { TiptapDocument } from '@repo/content/types'
import { getSchema, type Editor, type JSONContent } from '@tiptap/core'
import { EditorContent, useEditor } from '@tiptap/react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AdminRichTextToolbar } from './AdminRichTextToolbar'
import styles from './AdminRichTextEditor.module.css'
import {
  createContentEditorExtensions,
} from './contentEditorExtensions'
import {
  ImageUploadLifecycle,
  type CleanupOrphanedEditorImage,
  type EditorImageUploadRuntime,
  type PendingEditorAssetWork,
  type UploadEditorImage,
} from './editorImageUploadLifecycle'
import { createPendingAssetProducerKey } from './generationPendingAssetRegistry'
import {
  assertSemanticallyValidInitialDocument,
  canonicalFingerprint,
  canonicalValue,
  hasTransientImageState,
  type AdminRichTextCanonicalValue,
} from './managedEditorDocument'
import { SelectedImagePanel } from './SelectedImagePanel'

export type AdminRichTextEditorProps = {
  readonly cleanupOrphanedImage: CleanupOrphanedEditorImage
  readonly disabled: boolean
  readonly document: TiptapDocument
  /** Change this value when loading another record, even if its JSON is identical. */
  readonly documentKey: string
  readonly isAllowedImageUrl: (url: string) => boolean
  readonly onChange: (value: AdminRichTextCanonicalValue) => void
  readonly onContentError: (error: unknown) => void
  readonly onCreate: (value: AdminRichTextCanonicalValue) => void
  readonly onPendingAssetWorkChange: (event: PendingEditorAssetWork) => void
  readonly onUploadError: (error: unknown) => void
  readonly uploadImage: UploadEditorImage
}

type InitialContent = {
  readonly content: JSONContent
  readonly error: unknown | null
}

const emptyDocument = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
} satisfies JSONContent

type EditorRuntime = EditorImageUploadRuntime & {
  contentErrorReported: boolean
  created: boolean
  lastCleanFingerprint: string | null
}

type EditorCallbacks = Pick<
  AdminRichTextEditorProps,
  | 'cleanupOrphanedImage'
  | 'onChange'
  | 'onContentError'
  | 'onCreate'
  | 'onPendingAssetWorkChange'
  | 'onUploadError'
  | 'uploadImage'
>

let nextRuntimeId = 1

function editorAttributes(disabled: boolean, invalid: boolean): Record<string, string> {
  return {
    'aria-disabled': String(disabled),
    'aria-invalid': String(invalid),
    'aria-label': '본문 WYSIWYG 편집기',
    'aria-multiline': 'true',
    'aria-readonly': String(disabled || invalid),
    role: 'textbox',
  }
}

export function AdminRichTextEditor({
  cleanupOrphanedImage,
  disabled,
  document,
  documentKey,
  isAllowedImageUrl,
  onChange,
  onContentError,
  onCreate,
  onPendingAssetWorkChange,
  onUploadError,
  uploadImage,
}: AdminRichTextEditorProps) {
  const [contentErrorRuntimeId, setContentErrorRuntimeId] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState<{ readonly message: string; readonly runtimeId: number } | null>(null)
  const mountedRef = useRef(false)
  const runtimeRef = useRef<EditorRuntime | null>(null)
  const lifecycleRef = useRef<ImageUploadLifecycle | null>(null)
  const callbacksRef = useRef<EditorCallbacks>({
    cleanupOrphanedImage,
    onChange,
    onContentError,
    onCreate,
    onPendingAssetWorkChange,
    onUploadError,
    uploadImage,
  })
  const runtime = useMemo<EditorRuntime>(
    () => ({
      active: true,
      contentErrorReported: false,
      created: false,
      documentKey,
      editor: null,
      id: nextRuntimeId++,
      invalidated: false,
      isAllowedImageUrl,
      lastCleanFingerprint: null,
      pendingAssetProducerKey: createPendingAssetProducerKey(),
    }),
    // The URL predicate is immutable for a document generation. Changing it
    // must not silently replace a live editor with unsaved content.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [documentKey],
  )
  const isCurrentRuntime = (targetRuntime: EditorRuntime, currentEditor: Editor | null = targetRuntime.editor): boolean =>
    mountedRef.current &&
    runtimeRef.current === targetRuntime &&
    targetRuntime.active &&
    !targetRuntime.invalidated &&
    currentEditor !== null &&
    targetRuntime.editor === currentEditor &&
    !currentEditor.isDestroyed
  const [lifecycle] = useState(
    () => new ImageUploadLifecycle({
      clearUploadError: (targetRuntime) => {
        if (isCurrentRuntime(targetRuntime as EditorRuntime)) setUploadError(null)
      },
      emitCanonicalChange: (targetRuntime, currentEditor) => {
        const target = targetRuntime as EditorRuntime
        if (
          !isCurrentRuntime(target, currentEditor) ||
          lifecycleRef.current?.reconcileTerminalState(target, currentEditor) ||
          hasTransientImageState(currentEditor)
        ) {
          return
        }
        const value = canonicalValue(currentEditor, target.isAllowedImageUrl)
        const fingerprint = canonicalFingerprint(value)
        if (fingerprint === target.lastCleanFingerprint) return
        target.lastCleanFingerprint = fingerprint
        callbacksRef.current.onChange(value)
      },
      getCleanupOrphanedImage: () => callbacksRef.current.cleanupOrphanedImage,
      getCurrentRuntime: () => runtimeRef.current,
      getOnUploadError: (targetRuntime) => (error) => {
        if (isCurrentRuntime(targetRuntime as EditorRuntime)) callbacksRef.current.onUploadError(error)
      },
      getUploadImage: () => callbacksRef.current.uploadImage,
      notifyPendingAssetWork: (event) => callbacksRef.current.onPendingAssetWorkChange(event),
      showUploadError: (targetRuntime) => {
        const target = targetRuntime as EditorRuntime
        if (isCurrentRuntime(target)) {
          setUploadError((current) => current ?? {
            message: '본문 이미지 업로드에 실패했습니다. 다시 시도해 주세요.',
            runtimeId: target.id,
          })
        }
      },
    }),
  )

  useEffect(() => {
    callbacksRef.current = {
      cleanupOrphanedImage,
      onChange,
      onContentError,
      onCreate,
      onPendingAssetWorkChange,
      onUploadError,
      uploadImage,
    }
  }, [cleanupOrphanedImage, onChange, onContentError, onCreate, onPendingAssetWorkChange, onUploadError, uploadImage])

  const extensions = useMemo(
    () => createContentEditorExtensions(
      (currentEditor, files, position) => lifecycle.start(runtime, currentEditor, files, position),
      runtime.isAllowedImageUrl,
    ),
    [lifecycle, runtime],
  )
  const initialContent = useMemo<InitialContent>(() => {
    try {
      assertSemanticallyValidInitialDocument(document, runtime.isAllowedImageUrl)
      const node = getSchema(extensions).nodeFromJSON(document as JSONContent)
      node.check()
      return { content: document as JSONContent, error: null }
    } catch (error) {
      return { content: emptyDocument, error }
    }
  }, [document, extensions, runtime])
  const hasContentError = initialContent.error !== null || contentErrorRuntimeId === runtime.id
  const invalidEditorsRef = useRef(new WeakSet<Editor>())

  function reportContentError(currentEditor: Editor, error: unknown): void {
    invalidEditorsRef.current.add(currentEditor)
    currentEditor.setOptions({ editable: false })
    if (runtime.contentErrorReported) return
    runtime.contentErrorReported = true
    queueMicrotask(() => {
      if (!isCurrentRuntime(runtime, currentEditor)) return
      setContentErrorRuntimeId(runtime.id)
      callbacksRef.current.onContentError(error)
    })
  }

  const editor = useEditor(
    {
      content: initialContent.content,
      editable: !disabled && initialContent.error === null,
      enableContentCheck: true,
      editorProps: { attributes: editorAttributes(disabled, initialContent.error !== null) },
      extensions,
      onBeforeCreate: ({ editor: currentEditor }) => {
        runtime.editor = currentEditor
        if (initialContent.error !== null) reportContentError(currentEditor, initialContent.error)
      },
      onContentError: ({ editor: currentEditor, error }) => reportContentError(currentEditor, error),
      onCreate: ({ editor: currentEditor }) => {
        if (runtime.created || invalidEditorsRef.current.has(currentEditor)) return
        runtime.editor = currentEditor
        if (!isCurrentRuntime(runtime, currentEditor)) return
        if (hasTransientImageState(currentEditor)) {
          reportContentError(currentEditor, new Error('Stored editor content contains a pending image.'))
          return
        }
        runtime.created = true
        const value = canonicalValue(currentEditor, runtime.isAllowedImageUrl)
        runtime.lastCleanFingerprint = canonicalFingerprint(value)
        callbacksRef.current.onCreate(value)
      },
      onUpdate: ({ editor: currentEditor }) => {
        if (
          !isCurrentRuntime(runtime, currentEditor) ||
          !runtime.created ||
          invalidEditorsRef.current.has(currentEditor) ||
          lifecycle.reconcileTerminalState(runtime, currentEditor) ||
          lifecycle.hasPending(runtime) ||
          hasTransientImageState(currentEditor)
        ) return
        const value = canonicalValue(currentEditor, runtime.isAllowedImageUrl)
        const fingerprint = canonicalFingerprint(value)
        if (fingerprint === runtime.lastCleanFingerprint) return
        runtime.lastCleanFingerprint = fingerprint
        callbacksRef.current.onChange(value)
      },
    },
    [runtime],
  )

  useLayoutEffect(() => {
    mountedRef.current = true
    runtimeRef.current = runtime
    lifecycleRef.current = lifecycle
    runtime.active = true
    return () => {
      runtime.active = false
      if (runtimeRef.current === runtime) runtimeRef.current = null
      mountedRef.current = false
      queueMicrotask(() => {
        if (!runtime.active) lifecycle.invalidate(runtime)
      })
    }
  }, [lifecycle, runtime])

  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    editor.setOptions({ editorProps: { attributes: editorAttributes(disabled, hasContentError) } })
    editor.setEditable(!disabled && !hasContentError, false)
  }, [disabled, editor, hasContentError])

  return (
    <div className={styles.root}>
      <div
        className={styles.editorFrame}
        data-disabled={disabled || undefined}
        data-invalid={hasContentError || undefined}
      >
        {editor ? (
          <AdminRichTextToolbar
            disabled={disabled || hasContentError}
            editor={editor}
            onImageFiles={(currentEditor, files, position) => lifecycle.start(runtime, currentEditor, files, position)}
          />
        ) : null}
        <EditorContent className={styles.editorContent} editor={editor} />
      </div>
      {editor ? <SelectedImagePanel disabled={disabled || hasContentError} editor={editor} /> : null}
      {hasContentError ? (
        <p aria-live="polite" className={styles.contentError} role="status">
          저장된 본문 형식을 확인할 수 없습니다. 내용을 수정할 수 없습니다.
        </p>
      ) : null}
      <p aria-live="polite" className={styles.contentError} role="status">
        {uploadError?.runtimeId === runtime.id ? uploadError.message : null}
      </p>
    </div>
  )
}

export type { EditorImageInsertionPosition } from './contentEditorExtensions'
export type {
  CleanupOrphanedEditorImage,
  PendingEditorAssetWork,
  UploadEditorImage,
} from './editorImageUploadLifecycle'
export type { AdminRichTextCanonicalValue } from './managedEditorDocument'
