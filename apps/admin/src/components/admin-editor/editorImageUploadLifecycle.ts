import { validateEditorImage, type UploadedEditorImage } from '../../lib/contentAssetStorage'
import type { Editor } from '@tiptap/core'
import type { PendingAssetProducerKey, PendingAssetWork } from './generationPendingAssetRegistry'

export type { UploadedEditorImage }

export type EditorImageInsertionPosition = number | { readonly from: number; readonly to: number }
export type OrphanedEditorImageReason = 'editor_replaced' | 'placeholder_deleted'
export type UploadEditorImage = (file: File) => Promise<UploadedEditorImage>
export type CleanupOrphanedEditorImage = (
  image: UploadedEditorImage,
  reason: OrphanedEditorImageReason,
) => Promise<void>

/** Structural Tiptap subset, so this module stays independent of the editor package. */
export type ImageEditor = Editor

export type EditorImageUploadRuntime = {
  active: boolean
  readonly documentKey: string
  readonly id: number
  invalidated: boolean
  editor: ImageEditor | null
  readonly isAllowedImageUrl: (url: string) => boolean
  /** Editor core uses this to suppress duplicate canonical emissions. */
  lastCleanFingerprint?: string | null
  readonly pendingAssetProducerKey: PendingAssetProducerKey
}

export type PendingEditorAssetWork = PendingAssetWork

type LifecycleCallbacks = {
  readonly clearUploadError: (runtime: EditorImageUploadRuntime) => void
  readonly emitCanonicalChange: (runtime: EditorImageUploadRuntime, editor: ImageEditor) => void
  readonly getCleanupOrphanedImage: () => CleanupOrphanedEditorImage
  readonly getCurrentRuntime: () => EditorImageUploadRuntime | null
  /** Captured per runtime so a late A failure cannot be shown for B. */
  readonly getOnUploadError: (runtime: EditorImageUploadRuntime) => (error: unknown) => void
  readonly getUploadImage: () => UploadEditorImage
  readonly notifyPendingAssetWork: (event: PendingEditorAssetWork) => void
  readonly showUploadError: (runtime: EditorImageUploadRuntime) => void
}

type PendingImageUpload = {
  cleanupPromise: Promise<void> | null
  cleanupReason: OrphanedEditorImageReason | null
  readonly cleanupOrphanedImage: CleanupOrphanedEditorImage
  readonly editor: ImageEditor
  readonly file: File
  readonly objectUrl: string
  objectUrlRevoked: boolean
  readonly onUploadError: (error: unknown) => void
  readonly runtime: EditorImageUploadRuntime
  uploadedImage: UploadedEditorImage | null
  uploadFailed: boolean
  readonly uploadId: string
  readonly uploadImage: UploadEditorImage
  uploadSettled: boolean
}

export type TerminalImageDisposition =
  | { readonly kind: 'remove' }
  | { readonly image: UploadedEditorImage; readonly kind: 'normalize' }

export type TerminalImageCandidate = {
  readonly attrs: Readonly<Record<string, unknown>>
  readonly nodeSize: number
  readonly position: number
  readonly uploadId: string
}

export type TerminalImageReconciliation =
  | { readonly kind: 'remove'; readonly nodeSize: number; readonly position: number }
  | { readonly attributes: Readonly<Record<string, unknown>>; readonly kind: 'normalize'; readonly position: number }

/**
 * Produces a transaction plan without serializing blob URLs or upload IDs.
 * A removal tombstone always wins, including if an undo restores its preview.
 */
export function planTerminalImageReconciliation(
  candidates: readonly TerminalImageCandidate[],
  dispositions: ReadonlyMap<string, TerminalImageDisposition>,
  activeUploadIds: ReadonlySet<string>,
): TerminalImageReconciliation[] {
  const reconciliations: TerminalImageReconciliation[] = []
  for (const candidate of candidates) {
    const disposition = dispositions.get(candidate.uploadId)
    if (!disposition) continue
    if (disposition.kind === 'remove') {
      reconciliations.push({ kind: 'remove', nodeSize: candidate.nodeSize, position: candidate.position })
      continue
    }
    const attrs = {
      ...candidate.attrs,
      alt: disposition.image.alt,
      altReviewed: false,
      decorative: false,
      src: disposition.image.url,
      uploadId: activeUploadIds.has(candidate.uploadId) ? candidate.uploadId : null,
    }
    if (
      candidate.attrs.alt === attrs.alt &&
      candidate.attrs.altReviewed === attrs.altReviewed &&
      candidate.attrs.decorative === attrs.decorative &&
      candidate.attrs.src === attrs.src &&
      candidate.attrs.uploadId === attrs.uploadId
    ) continue
    reconciliations.push({ attributes: attrs, kind: 'normalize', position: candidate.position })
  }
  return reconciliations.sort((left, right) => right.position - left.position)
}

function safelyCall<Args extends readonly unknown[]>(callback: (...args: Args) => void, ...args: Args): void {
  try {
    callback(...args)
  } catch {
    // A consumer error must not leave an object URL or Storage object behind.
  }
}

function findPlaceholder(editor: ImageEditor, uploadId: string): { readonly position: number; readonly nodeSize: number } | null {
  let match: { position: number; nodeSize: number } | null = null
  editor.state.doc.descendants((node, position) => {
    if (node.type.name === 'image' && node.attrs.uploadId === uploadId) {
      match = { nodeSize: node.nodeSize, position }
      return false
    }
    return match === null
  })
  return match
}

function provisionalAlt(file: File): string {
  return file.name.replace(/\.[^.]+$/u, '')
}

export class ImageUploadLifecycle {
  private readonly callbacks: LifecycleCallbacks
  private readonly entries = new Map<string, PendingImageUpload>()
  private readonly finalizingRuntimeIds = new Set<number>()
  private readonly terminalByRuntime = new Map<number, Map<string, TerminalImageDisposition>>()

  constructor(callbacks: LifecycleCallbacks) {
    this.callbacks = callbacks
  }

  hasPending(runtime: EditorImageUploadRuntime): boolean {
    return !runtime.invalidated && this.entriesFor(runtime).length > 0
  }

  invalidate(runtime: EditorImageUploadRuntime): void {
    if (runtime.invalidated) return
    runtime.invalidated = true
    // Terminal dispositions only protect a live editor through undo/redo.
    // Once detached, retaining them serves no purpose and leaks one map per
    // document generation for the lifetime of this lifecycle instance.
    this.terminalByRuntime.delete(runtime.id)
    // Detach immediately from parent busy state. The entries deliberately
    // remain in memory so a stalled request can still clean up a late object.
    this.notifyPending(runtime)
    for (const entry of this.entriesFor(runtime)) {
      this.revokeObjectUrl(entry)
      if (entry.uploadedImage) void this.ensureCleanup(entry, 'editor_replaced')
    }
    void this.maybeFinalize(runtime)
  }

  /** Reapplies terminal results after undo/redo before core emits canonical JSON. */
  reconcileTerminalState(runtime: EditorImageUploadRuntime, editor: ImageEditor): boolean {
    if (runtime.invalidated || runtime.editor !== editor || editor.isDestroyed) return false
    const dispositions = this.terminalByRuntime.get(runtime.id)
    if (!dispositions?.size) return false
    const candidates: TerminalImageCandidate[] = []
    editor.state.doc.descendants((node, position) => {
      const uploadId = node.attrs.uploadId
      if (node.type.name === 'image' && typeof uploadId === 'string' && dispositions.has(uploadId)) {
        candidates.push({ attrs: node.attrs, nodeSize: node.nodeSize, position, uploadId })
      }
    })
    const reconciliations = planTerminalImageReconciliation(
      candidates,
      dispositions,
      new Set(this.entriesFor(runtime).map((entry) => entry.uploadId)),
    )
    if (!reconciliations.length) return false
    let transaction = editor.state.tr
    for (const reconciliation of reconciliations) {
      if (reconciliation.kind === 'remove') {
        transaction = transaction.delete(reconciliation.position, reconciliation.position + reconciliation.nodeSize)
      } else {
        transaction = transaction.setNodeMarkup(reconciliation.position, undefined, reconciliation.attributes)
      }
    }
    editor.view.dispatch(transaction.setMeta('addToHistory', false))
    return true
  }

  start(
    runtime: EditorImageUploadRuntime,
    editor: ImageEditor,
    files: readonly File[],
    position: EditorImageInsertionPosition,
  ): void {
    // This is the last authoritative boundary before allocating a blob URL or
    // mutating the document. Props can change between a toolbar event and its
    // handler, so the editor core must not be trusted as the only guard.
    if (!this.canStart(runtime, editor) || files.length === 0) return
    const entries: PendingImageUpload[] = []
    let invalidImageError: Error | null = null
    try {
      for (const file of files) {
        const validation = validateEditorImage(file)
        if (!validation.ok) {
          invalidImageError ??= new Error(validation.reason)
          continue
        }
        entries.push({
          cleanupOrphanedImage: this.callbacks.getCleanupOrphanedImage(),
          cleanupPromise: null,
          cleanupReason: null,
          editor,
          file,
          objectUrl: URL.createObjectURL(file),
          objectUrlRevoked: false,
          onUploadError: this.callbacks.getOnUploadError(runtime),
          runtime,
          uploadedImage: null,
          uploadFailed: false,
          uploadId: crypto.randomUUID(),
          uploadImage: this.callbacks.getUploadImage(),
          uploadSettled: false,
        })
      }
    } catch (error) {
      for (const entry of entries) this.revokeObjectUrl(entry)
      this.reportUploadError(runtime, this.callbacks.getOnUploadError(runtime), error)
      return
    }
    if (!entries.length) {
      if (invalidImageError) this.reportUploadError(runtime, this.callbacks.getOnUploadError(runtime), invalidImageError)
      return
    }
    for (const entry of entries) this.entries.set(entry.uploadId, entry)
    this.notifyPending(runtime)
    safelyCall(this.callbacks.clearUploadError, runtime)
    // A valid sibling upload must not make a rejected MIME/size error vanish.
    if (invalidImageError) this.reportUploadError(runtime, this.callbacks.getOnUploadError(runtime), invalidImageError)
    try {
      const inserted = editor.commands.insertContentAt(position, entries.map((entry) => ({
        attrs: {
          alt: provisionalAlt(entry.file), altReviewed: false, decorative: false,
          src: entry.objectUrl, uploadId: entry.uploadId,
        },
        type: 'image',
      })))
      if (!inserted) throw new Error('The editor rejected the image placeholders.')
    } catch (error) {
      for (const entry of entries) {
        this.entries.delete(entry.uploadId)
        this.revokeObjectUrl(entry)
      }
      this.notifyPending(runtime)
      this.reportUploadError(runtime, this.callbacks.getOnUploadError(runtime), error)
      return
    }
    for (const entry of entries) void this.upload(entry)
  }

  private entriesFor(runtime: EditorImageUploadRuntime): PendingImageUpload[] {
    return [...this.entries.values()].filter((entry) => entry.runtime === runtime)
  }

  private canStart(runtime: EditorImageUploadRuntime, editor: ImageEditor): boolean {
    return runtime.active &&
      !runtime.invalidated &&
      runtime.editor === editor &&
      this.callbacks.getCurrentRuntime() === runtime &&
      !editor.isDestroyed &&
      editor.isEditable
  }

  private isLive(entry: PendingImageUpload): boolean {
    return entry.runtime.active && !entry.runtime.invalidated && entry.runtime.editor === entry.editor &&
      !entry.editor.isDestroyed && this.callbacks.getCurrentRuntime() === entry.runtime
  }

  private registerTerminal(entry: PendingImageUpload, disposition: TerminalImageDisposition): void {
    if (entry.runtime.invalidated) return
    const dispositions = this.terminalByRuntime.get(entry.runtime.id) ?? new Map<string, TerminalImageDisposition>()
    const current = dispositions.get(entry.uploadId)
    if (current?.kind !== 'remove') dispositions.set(entry.uploadId, current?.kind === 'normalize' && disposition.kind === 'normalize' ? current : disposition)
    this.terminalByRuntime.set(entry.runtime.id, dispositions)
  }

  private notifyPending(runtime: EditorImageUploadRuntime): void {
    safelyCall(this.callbacks.notifyPendingAssetWork, {
      count: runtime.invalidated ? 0 : this.entriesFor(runtime).length,
      generation: runtime.documentKey,
      producerKey: runtime.pendingAssetProducerKey,
    })
  }

  private reportUploadError(runtime: EditorImageUploadRuntime, callback: (error: unknown) => void, error: unknown): void {
    safelyCall(callback, error)
    safelyCall(this.callbacks.showUploadError, runtime)
  }

  private revokeObjectUrl(entry: PendingImageUpload): void {
    if (entry.objectUrlRevoked) return
    entry.objectUrlRevoked = true
    try {
      URL.revokeObjectURL(entry.objectUrl)
    } catch (error) {
      this.reportUploadError(entry.runtime, entry.onUploadError, error)
    }
  }

  private removePlaceholder(entry: PendingImageUpload): void {
    if (!this.isLive(entry)) return
    const match = findPlaceholder(entry.editor, entry.uploadId)
    if (!match) return
    entry.editor.view.dispatch(entry.editor.state.tr.delete(match.position, match.position + match.nodeSize).setMeta('addToHistory', false))
  }

  private replacePlaceholder(entry: PendingImageUpload, image: UploadedEditorImage): boolean {
    if (!this.isLive(entry)) return false
    const match = findPlaceholder(entry.editor, entry.uploadId)
    const node = match && entry.editor.state.doc.nodeAt(match.position)
    if (!match || !node) return false
    entry.editor.view.dispatch(entry.editor.state.tr.setNodeMarkup(match.position, undefined, {
      ...node.attrs, alt: image.alt, altReviewed: false, decorative: false, src: image.url,
    }).setMeta('addToHistory', false))
    return true
  }

  private async upload(entry: PendingImageUpload): Promise<void> {
    try {
      const image = await entry.uploadImage(entry.file)
      entry.uploadedImage = image
      if (!this.isLive(entry)) {
        await this.ensureCleanup(entry, 'editor_replaced')
      } else if (!entry.runtime.isAllowedImageUrl(image.url)) {
        entry.uploadFailed = true
        this.registerTerminal(entry, { kind: 'remove' })
        this.removePlaceholder(entry)
        this.reportUploadError(entry.runtime, entry.onUploadError, new Error('The uploaded image URL is not allowed for this document.'))
        await this.ensureCleanup(entry, 'placeholder_deleted')
      } else if (this.replacePlaceholder(entry, image)) {
        this.registerTerminal(entry, { image, kind: 'normalize' })
      } else {
        await this.ensureCleanup(entry, 'placeholder_deleted')
      }
    } catch (error) {
      entry.uploadFailed = true
      this.registerTerminal(entry, { kind: 'remove' })
      this.removePlaceholder(entry)
      this.reportUploadError(entry.runtime, entry.onUploadError, error)
    } finally {
      entry.uploadSettled = true
      this.revokeObjectUrl(entry)
      await this.maybeFinalize(entry.runtime)
    }
  }

  private ensureCleanup(entry: PendingImageUpload, reason: OrphanedEditorImageReason): Promise<void> {
    if (reason === 'placeholder_deleted') this.registerTerminal(entry, { kind: 'remove' })
    if (!entry.uploadedImage) return Promise.resolve()
    if (entry.cleanupPromise) return entry.cleanupPromise
    entry.cleanupReason = reason
    entry.cleanupPromise = Promise.resolve()
      .then(() => entry.cleanupOrphanedImage(entry.uploadedImage as UploadedEditorImage, reason))
      .catch((error: unknown) => this.reportUploadError(entry.runtime, entry.onUploadError, error))
    return entry.cleanupPromise
  }

  private async maybeFinalize(runtime: EditorImageUploadRuntime): Promise<void> {
    if (this.finalizingRuntimeIds.has(runtime.id)) return
    if (this.entriesFor(runtime).some((entry) => !entry.uploadSettled)) return
    this.finalizingRuntimeIds.add(runtime.id)
    try {
      while (true) {
        const entries = this.entriesFor(runtime)
        if (!entries.length || entries.some((entry) => !entry.uploadSettled)) return
        const cleanups: Promise<void>[] = []
        for (const entry of entries) {
          if (!entry.uploadedImage || entry.cleanupReason) continue
          if (!this.isLive(entry)) cleanups.push(this.ensureCleanup(entry, 'editor_replaced'))
          else if (!findPlaceholder(entry.editor, entry.uploadId)) cleanups.push(this.ensureCleanup(entry, 'placeholder_deleted'))
        }
        if (cleanups.length) {
          await Promise.all(cleanups)
          continue
        }
        if (runtime.invalidated || !runtime.active || this.callbacks.getCurrentRuntime() !== runtime || !runtime.editor || runtime.editor.isDestroyed) {
          for (const entry of entries) this.entries.delete(entry.uploadId)
          this.notifyPending(runtime)
          return
        }
        let transaction = runtime.editor.state.tr
        let changed = false
        for (const entry of entries) {
          const match = findPlaceholder(runtime.editor, entry.uploadId)
          if (!entry.uploadedImage || entry.uploadFailed || !match || entry.cleanupReason) {
            if (match && entry.cleanupReason) transaction = transaction.delete(match.position, match.position + match.nodeSize)
            changed ||= Boolean(match && entry.cleanupReason)
            continue
          }
          const node = runtime.editor.state.doc.nodeAt(match.position)
          if (!node) continue
          transaction = transaction.setNodeMarkup(match.position, undefined, { ...node.attrs, uploadId: null })
          changed = true
        }
        if (changed) runtime.editor.view.dispatch(transaction.setMeta('addToHistory', false))
        for (const entry of entries) this.entries.delete(entry.uploadId)
        this.notifyPending(runtime)
        safelyCall(this.callbacks.emitCanonicalChange, runtime, runtime.editor)
        return
      }
    } finally {
      this.finalizingRuntimeIds.delete(runtime.id)
    }
  }
}
