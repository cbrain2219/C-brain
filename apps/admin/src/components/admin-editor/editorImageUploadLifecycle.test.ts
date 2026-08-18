import { describe, expect, it, vi } from 'vitest'
import type { UploadedEditorImage } from '../../lib/contentAssetStorage'
import {
  ImageUploadLifecycle,
  planTerminalImageReconciliation,
  type EditorImageUploadRuntime,
  type ImageEditor,
} from './editorImageUploadLifecycle'
import { createPendingAssetProducerKey } from './generationPendingAssetRegistry'

type Deferred<Value> = { readonly promise: Promise<Value>; readonly resolve: (value: Value) => void; readonly reject: (reason: unknown) => void }

function deferred<Value>(): Deferred<Value> {
  let resolve!: (value: Value) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<Value>((nextResolve, nextReject) => { resolve = nextResolve; reject = nextReject })
  return { promise, reject, resolve }
}

async function settle(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

function file(name: string): File {
  return new File(['image'], name, { type: 'image/png' })
}

function image(path: string): UploadedEditorImage {
  return { alt: '대체 텍스트', path, url: `https://project.supabase.co/storage/v1/object/public/public-assets/${path}` }
}

type TestNode = { readonly attrs: Readonly<Record<string, unknown>>; readonly nodeSize: number; readonly type: { readonly name: string } }

function fakeEditor(): ImageEditor & { readonly insertions: unknown[]; readonly nodes: TestNode[] } {
  const nodes: TestNode[] = []
  const insertions: unknown[] = []
  const transaction = {
    delete(from: number) {
      nodes.splice(from - 1, 1)
      return transaction
    },
    setMeta() { return transaction },
    setNodeMarkup(position: number, _type: unknown, attrs?: Readonly<Record<string, unknown>>) {
      const current = nodes[position - 1]
      if (current) nodes[position - 1] = { ...current, attrs: attrs ?? {} }
      return transaction
    },
  }
  return {
    commands: {
      insertContentAt: (_position: unknown, content: readonly unknown[]) => {
        insertions.push(_position)
        for (const item of content as readonly { readonly attrs: Readonly<Record<string, unknown>>; readonly type: string }[]) {
          nodes.push({ attrs: item.attrs, nodeSize: 1, type: { name: item.type } })
        }
        return true
      },
    },
    get isEditable() { return true },
    get isDestroyed() { return false },
    insertions,
    nodes,
    state: {
      doc: {
        descendants(callback: (node: TestNode, position: number) => boolean | void) {
          for (let index = 0; index < nodes.length; index += 1) {
            if (callback(nodes[index]!, index + 1) === false) break
          }
        },
        nodeAt(position: number) { return nodes[position - 1] ?? null },
      },
      tr: transaction,
    },
    view: { dispatch: vi.fn() },
  } as unknown as ImageEditor & { readonly insertions: unknown[]; readonly nodes: TestNode[] }
}

function runtime(id: number, documentKey: string, editor: ImageEditor): EditorImageUploadRuntime {
  return {
    active: true,
    documentKey,
    editor,
    id,
    invalidated: false,
    isAllowedImageUrl: (url) => url.startsWith('https://project.supabase.co/'),
    pendingAssetProducerKey: createPendingAssetProducerKey(),
  }
}

describe('ImageUploadLifecycle', () => {
  it('does not allocate or mutate for disabled, stale, inactive, or destroyed editors', () => {
    const scenarios = [
      'disabled',
      'stale',
      'inactive',
      'destroyed',
    ] as const
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL')

    for (const scenario of scenarios) {
      const editor = fakeEditor()
      const activeRuntime = runtime(1, 'record-a', editor)
      const otherRuntime = runtime(2, 'record-b', fakeEditor())
      let current: EditorImageUploadRuntime | null = activeRuntime
      const upload = vi.fn(async () => image('content/blog/a/images/should-not-upload.png'))
      const pending = vi.fn()
      const emit = vi.fn()
      const lifecycle = new ImageUploadLifecycle({
        clearUploadError: vi.fn(), emitCanonicalChange: emit, getCleanupOrphanedImage: () => vi.fn(),
        getCurrentRuntime: () => current, getOnUploadError: () => vi.fn(), getUploadImage: () => upload,
        notifyPendingAssetWork: pending, showUploadError: vi.fn(),
      })

      if (scenario === 'disabled') Object.defineProperty(editor, 'isEditable', { configurable: true, value: false })
      if (scenario === 'stale') current = otherRuntime
      if (scenario === 'inactive') activeRuntime.active = false
      if (scenario === 'destroyed') Object.defineProperty(editor, 'isDestroyed', { configurable: true, value: true })

      lifecycle.start(activeRuntime, editor, [file(`${scenario}.png`)], 1)
      expect(editor.nodes).toHaveLength(0)
      expect(upload).not.toHaveBeenCalled()
      expect(pending).not.toHaveBeenCalled()
      expect(emit).not.toHaveBeenCalled()
      expect(lifecycle.hasPending(activeRuntime)).toBe(false)
    }
    expect(createObjectUrl).not.toHaveBeenCalled()
    createObjectUrl.mockRestore()
  })

  it('supports toolbar, paste, and drop insertion while withholding canonical output until every upload settles', async () => {
    const editor = fakeEditor()
    const current = runtime(1, 'record-a', editor)
    const first = deferred<UploadedEditorImage>()
    const second = deferred<UploadedEditorImage>()
    const third = deferred<UploadedEditorImage>()
    const uploads = [first, second, third]
    const emit = vi.fn()
    const lifecycle = new ImageUploadLifecycle({
      clearUploadError: vi.fn(), emitCanonicalChange: emit, getCleanupOrphanedImage: () => vi.fn(),
      getCurrentRuntime: () => current, getOnUploadError: () => vi.fn(),
      getUploadImage: () => () => uploads.shift()!.promise,
      notifyPendingAssetWork: vi.fn(), showUploadError: vi.fn(),
    })
    lifecycle.start(current, editor, [file('toolbar.png')], 1)
    lifecycle.start(current, editor, [file('paste.png')], { from: 2, to: 2 })
    lifecycle.start(current, editor, [file('drop.png')], 3)
    expect(lifecycle.hasPending(current)).toBe(true)

    second.resolve(image('content/blog/a/images/second.png'))
    await settle()
    expect(emit).not.toHaveBeenCalled()
    first.resolve(image('content/blog/a/images/first.png'))
    third.resolve(image('content/blog/a/images/third.png'))
    await settle()
    expect(emit).toHaveBeenCalledTimes(1)
    expect(editor.insertions).toEqual([1, { from: 2, to: 2 }, 3])
    expect(editor.nodes).toHaveLength(3)
    expect(editor.nodes.map((node) => node.attrs.src)).toEqual([
      expect.stringContaining('/first.png'),
      expect.stringContaining('/second.png'),
      expect.stringContaining('/third.png'),
    ])
    expect(JSON.stringify(editor.nodes)).not.toContain('blob:')
    expect(editor.nodes.every((node) => node.attrs.uploadId === null)).toBe(true)
    expect(lifecycle.hasPending(current)).toBe(false)
  })

  it('cleans a late upload after its placeholder was deleted or its document was replaced', async () => {
    const editor = fakeEditor()
    const recordA = runtime(1, 'record-a', editor)
    const recordB = runtime(2, 'record-b', fakeEditor())
    let current: EditorImageUploadRuntime | null = recordA
    const upload = deferred<UploadedEditorImage>()
    const cleanup = vi.fn(async () => undefined)
    const revoked = vi.spyOn(URL, 'revokeObjectURL')
    const emit = vi.fn()
    const pending = vi.fn()
    const lifecycle = new ImageUploadLifecycle({
      clearUploadError: vi.fn(), emitCanonicalChange: emit, getCleanupOrphanedImage: () => cleanup,
      getCurrentRuntime: () => current, getOnUploadError: () => vi.fn(), getUploadImage: () => () => upload.promise,
      notifyPendingAssetWork: pending, showUploadError: vi.fn(),
    })
    lifecycle.start(recordA, editor, [file('late.png')], 1)
    current = recordB
    lifecycle.invalidate(recordA)
    expect(lifecycle.hasPending(recordA)).toBe(false)
    expect(pending).toHaveBeenLastCalledWith(expect.objectContaining({ count: 0, generation: 'record-a' }))
    expect(recordB.editor?.state.doc).toBeDefined()
    upload.resolve(image('content/blog/a/images/late.png'))
    await vi.waitFor(() => expect(cleanup).toHaveBeenCalledTimes(1))
    expect(cleanup).toHaveBeenCalledWith(expect.objectContaining({ path: expect.stringContaining('late.png') }), 'editor_replaced')
    expect(revoked).toHaveBeenCalled()
    expect(emit).not.toHaveBeenCalled()
    expect((recordB.editor as ReturnType<typeof fakeEditor>).nodes).toHaveLength(0)
    revoked.mockRestore()
  })

  it('tombstones a deleted placeholder and reports a failed Storage cleanup', async () => {
    const editor = fakeEditor()
    const current = runtime(1, 'record-a', editor)
    const upload = deferred<UploadedEditorImage>()
    const cleanup = vi.fn(async () => { throw new Error('cleanup failed') })
    const report = vi.fn()
    const lifecycle = new ImageUploadLifecycle({
      clearUploadError: vi.fn(), emitCanonicalChange: vi.fn(), getCleanupOrphanedImage: () => cleanup,
      getCurrentRuntime: () => current,
      getOnUploadError: (targetRuntime) => targetRuntime === current ? report : vi.fn(),
      getUploadImage: () => () => upload.promise,
      notifyPendingAssetWork: vi.fn(), showUploadError: vi.fn(),
    })
    lifecycle.start(current, editor, [file('deleted.png')], 1)
    editor.nodes.splice(0, 1)
    upload.resolve(image('content/blog/a/images/deleted.png'))
    await vi.waitFor(() => expect(lifecycle.hasPending(current)).toBe(false))
    expect(cleanup).toHaveBeenCalledWith(expect.objectContaining({ path: expect.stringContaining('deleted.png') }), 'placeholder_deleted')
    expect(report).toHaveBeenCalledWith(expect.objectContaining({ message: 'cleanup failed' }))
  })

  it('removes a rejected upload placeholder without discarding other state', async () => {
    const editor = fakeEditor()
    const current = runtime(1, 'record-a', editor)
    const upload = deferred<UploadedEditorImage>()
    const report = vi.fn()
    const show = vi.fn()
    const revoked = vi.spyOn(URL, 'revokeObjectURL')
    const pending = vi.fn()
    const lifecycle = new ImageUploadLifecycle({
      clearUploadError: vi.fn(), emitCanonicalChange: vi.fn(),
      getCleanupOrphanedImage: () => async () => undefined,
      getCurrentRuntime: () => current, getOnUploadError: () => report,
      getUploadImage: () => () => upload.promise, notifyPendingAssetWork: pending, showUploadError: show,
    })
    lifecycle.start(current, editor, [file('bad.png')], 1)
    upload.reject(new Error('upload failed'))
    await vi.waitFor(() => expect(lifecycle.hasPending(current)).toBe(false))
    expect(editor.nodes).toHaveLength(0)
    expect(report).toHaveBeenCalled()
    expect(show).toHaveBeenCalled()
    expect(pending).toHaveBeenLastCalledWith(expect.objectContaining({ count: 0 }))
    expect(revoked).toHaveBeenCalled()
    revoked.mockRestore()
  })

  it('rejects resolved unowned URLs by removing the placeholder and exact uploaded object', async () => {
    const editor = fakeEditor()
    const current = { ...runtime(1, 'record-a', editor), isAllowedImageUrl: () => false }
    const upload = deferred<UploadedEditorImage>()
    const cleanup = vi.fn(async () => undefined)
    const report = vi.fn()
    const lifecycle = new ImageUploadLifecycle({
      clearUploadError: vi.fn(), emitCanonicalChange: vi.fn(), getCleanupOrphanedImage: () => cleanup,
      getCurrentRuntime: () => current, getOnUploadError: () => report, getUploadImage: () => () => upload.promise,
      notifyPendingAssetWork: vi.fn(), showUploadError: vi.fn(),
    })
    lifecycle.start(current, editor, [file('unowned.png')], 1)
    const uploaded = image('content/blog/a/images/unowned.png')
    upload.resolve(uploaded)
    await vi.waitFor(() => expect(lifecycle.hasPending(current)).toBe(false))
    expect(editor.nodes).toHaveLength(0)
    expect(cleanup).toHaveBeenCalledWith(uploaded, 'placeholder_deleted')
    expect((report.mock.calls[0]?.[0] as Error).message).toContain('not allowed')
  })

  it('reports invalid MIME and size once without inserting a transient image', () => {
    const editor = fakeEditor()
    const current = runtime(1, 'record-a', editor)
    const report = vi.fn()
    const lifecycle = new ImageUploadLifecycle({
      clearUploadError: vi.fn(), emitCanonicalChange: vi.fn(), getCleanupOrphanedImage: () => vi.fn(),
      getCurrentRuntime: () => current, getOnUploadError: () => report, getUploadImage: () => vi.fn(),
      notifyPendingAssetWork: vi.fn(), showUploadError: vi.fn(),
    })
    const oversized = file('large.png')
    Object.defineProperty(oversized, 'size', { configurable: true, value: 10 * 1024 * 1024 + 1 })
    lifecycle.start(current, editor, [new File(['svg'], 'x.svg', { type: 'image/svg+xml' }), oversized], 1)
    expect(editor.nodes).toHaveLength(0)
    expect(report).toHaveBeenCalledTimes(1)
    expect(report).toHaveBeenCalledWith(expect.objectContaining({ message: 'invalid_mime_type' }))
  })

  it('keeps one invalid-file error visible while valid siblings upload', async () => {
    const editor = fakeEditor()
    const current = runtime(1, 'record-a', editor)
    const events: string[] = []
    const lifecycle = new ImageUploadLifecycle({
      clearUploadError: () => { events.push('clear') }, emitCanonicalChange: vi.fn(),
      getCleanupOrphanedImage: () => vi.fn(), getCurrentRuntime: () => current,
      getOnUploadError: () => (error) => { events.push((error as Error).message) },
      getUploadImage: () => async () => image('content/blog/a/images/valid.png'),
      notifyPendingAssetWork: vi.fn(), showUploadError: vi.fn(),
    })
    lifecycle.start(current, editor, [new File(['svg'], 'bad.svg', { type: 'image/svg+xml' }), file('valid.png')], 1)
    expect(events).toEqual(['clear', 'invalid_mime_type'])
    expect(editor.nodes).toHaveLength(1)
    await vi.waitFor(() => expect(lifecycle.hasPending(current)).toBe(false))
  })

  it('dispatches terminal restoration/tombstone reconciliation before canonical output', async () => {
    const editor = fakeEditor()
    const current = {
      ...runtime(1, 'record-a', editor),
      isAllowedImageUrl: (url: string) => !url.includes('unowned'),
    }
    const unowned = deferred<UploadedEditorImage>()
    const normal = deferred<UploadedEditorImage>()
    const blocker = deferred<UploadedEditorImage>()
    const uploads = [unowned, normal, blocker]
    const cleanup = vi.fn(async () => undefined)
    const emit = vi.fn()
    const lifecycle = new ImageUploadLifecycle({
      clearUploadError: vi.fn(), emitCanonicalChange: emit, getCleanupOrphanedImage: () => cleanup,
      getCurrentRuntime: () => current, getOnUploadError: () => vi.fn(),
      getUploadImage: () => () => uploads.shift()!.promise,
      notifyPendingAssetWork: vi.fn(), showUploadError: vi.fn(),
    })
    lifecycle.start(current, editor, [file('unowned.png'), file('normal.png'), file('blocker.png')], 1)
    const tombstone = editor.nodes[0]!
    const normalized = editor.nodes[1]!

    unowned.resolve(image('content/blog/a/images/unowned.png'))
    await vi.waitFor(() => expect(cleanup).toHaveBeenCalledTimes(1))
    editor.nodes.splice(0, 0, tombstone)
    expect(lifecycle.reconcileTerminalState(current, editor)).toBe(true)
    expect(editor.nodes).toHaveLength(2)
    expect(emit).not.toHaveBeenCalled()

    normal.resolve(image('content/blog/a/images/normal.png'))
    await settle()
    editor.nodes[0] = { ...editor.nodes[0]!, attrs: normalized.attrs }
    expect(lifecycle.reconcileTerminalState(current, editor)).toBe(true)
    expect(editor.nodes[0]?.attrs.src).toContain('normal.png')
    expect(editor.nodes[0]?.attrs.uploadId).toBe(normalized.attrs.uploadId)
    expect(editor.view.dispatch).toHaveBeenCalled()
    expect(emit).not.toHaveBeenCalled()

    blocker.resolve(image('content/blog/a/images/blocker.png'))
    await vi.waitFor(() => expect(lifecycle.hasPending(current)).toBe(false))
  })

  it('releases terminal dispositions when a completed runtime is invalidated', async () => {
    const editor = fakeEditor()
    const oldRuntime = runtime(1, 'record-a', editor)
    let current: EditorImageUploadRuntime | null = oldRuntime
    const lifecycle = new ImageUploadLifecycle({
      clearUploadError: vi.fn(), emitCanonicalChange: vi.fn(), getCleanupOrphanedImage: () => vi.fn(),
      getCurrentRuntime: () => current, getOnUploadError: () => vi.fn(),
      getUploadImage: () => async () => image('content/blog/a/images/completed.png'),
      notifyPendingAssetWork: vi.fn(), showUploadError: vi.fn(),
    })
    lifecycle.start(oldRuntime, editor, [file('completed.png')], 1)
    const oldPlaceholder = editor.nodes[0]!
    await vi.waitFor(() => expect(lifecycle.hasPending(oldRuntime)).toBe(false))

    lifecycle.invalidate(oldRuntime)
    const replacement = runtime(1, 'record-b', editor)
    current = replacement
    editor.nodes[0] = oldPlaceholder

    // Reusing an id here makes disposition retention externally observable;
    // production IDs are monotonic, but detached state must still be released.
    expect(lifecycle.reconcileTerminalState(replacement, editor)).toBe(false)
    expect(editor.nodes[0]?.attrs.src).toBe(oldPlaceholder.attrs.src)
  })

  it('reconciles undo/redo tombstones before normalizations in reverse document position order', () => {
    const candidate = (position: number, uploadId: string): { readonly attrs: Readonly<Record<string, unknown>>; readonly nodeSize: number; readonly position: number; readonly uploadId: string } => ({
      attrs: { alt: 'preview', altReviewed: false, decorative: false, src: `blob:${uploadId}`, uploadId },
      nodeSize: 1, position, uploadId,
    })
    const reconciliations = planTerminalImageReconciliation(
      [candidate(2, 'normalize'), candidate(7, 'remove')],
      new Map([
        ['normalize', { image: image('content/blog/a/images/normalized.png'), kind: 'normalize' as const }],
        ['remove', { kind: 'remove' as const }],
      ]),
      new Set(),
    )
    expect(reconciliations).toEqual([
      { kind: 'remove', nodeSize: 1, position: 7 },
      expect.objectContaining({ kind: 'normalize', position: 2, attributes: expect.objectContaining({ src: expect.stringContaining('normalized.png'), uploadId: null }) }),
    ])
  })
})
