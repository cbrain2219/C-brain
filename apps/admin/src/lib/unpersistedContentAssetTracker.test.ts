import { describe, expect, it, vi } from 'vitest'
import { UnpersistedContentAssetTracker } from './unpersistedContentAssetTracker'

const scope = '00000000-0000-4000-8000-000000000001'
const path = (name: string) => `content/blog/${scope}/images/${name}.png`

describe('UnpersistedContentAssetTracker', () => {
  it('tracks only exact immutable paths and deduplicates uploads', () => {
    const tracker = new UnpersistedContentAssetTracker({ entity: 'blog', assetScope: scope, remove: vi.fn() })
    const exact = path('00000000-0000-4000-8000-000000000099')
    expect(tracker.track(exact)).toBe(true)
    expect(tracker.track(exact)).toBe(false)
    expect(tracker.track(`content/blog/00000000-0000-4000-8000-000000000002/images/00000000-0000-4000-8000-000000000099.png`)).toBe(false)
    expect(tracker.track(`content/blog/${scope}/images/not-immutable.png`)).toBe(false)
    expect(tracker.pendingPaths()).toEqual([exact])
  })

  it('forgets synchronously after a successful save so unmount cleanup deletes nothing', async () => {
    const remove = vi.fn(async () => undefined)
    const tracker = new UnpersistedContentAssetTracker({ entity: 'blog', assetScope: scope, remove })
    tracker.track(path('00000000-0000-4000-8000-000000000099'))
    tracker.commit()
    expect(tracker.pendingPaths()).toEqual([])
    await expect(tracker.cleanup()).resolves.toEqual({ failed: [], removed: [] })
    expect(remove).not.toHaveBeenCalled()
  })

  it('drains every failed-save upload on unmount/scope change and retains failures for retry', async () => {
    const first = path('00000000-0000-4000-8000-000000000099')
    const second = path('00000000-0000-4000-8000-000000000098')
    const failure = new Error('Storage unavailable')
    let secondAttempts = 0
    const remove = vi.fn(async (...args: [string, string, string]) => {
      const target = args[2]
      if (target === second && secondAttempts++ === 0) throw failure
    })
    const tracker = new UnpersistedContentAssetTracker({ entity: 'blog', assetScope: scope, remove })
    tracker.track(first)
    tracker.track(second)

    await expect(tracker.cleanup()).resolves.toEqual({
      failed: [{ error: failure, path: second }],
      removed: [first],
    })
    expect(tracker.pendingPaths()).toEqual([second])
    await expect(tracker.cleanup()).resolves.toEqual({ failed: [], removed: [second] })
    expect(remove).toHaveBeenCalledTimes(3)
  })

  it('keeps old-scope cleanup isolated when a form switches to a new document scope', async () => {
    const oldScope = scope
    const newScope = '00000000-0000-4000-8000-000000000002'
    const remove = vi.fn(async () => undefined)
    const oldTracker = new UnpersistedContentAssetTracker({ entity: 'blog', assetScope: oldScope, remove })
    const newTracker = new UnpersistedContentAssetTracker({ entity: 'blog', assetScope: newScope, remove })
    const oldPath = `content/blog/${oldScope}/images/00000000-0000-4000-8000-000000000099.png`
    oldTracker.track(oldPath)

    await oldTracker.cleanup()
    expect(remove).toHaveBeenCalledWith('blog', oldScope, oldPath)
    expect(newTracker.pendingPaths()).toEqual([])
  })

  it('shares one concurrent cleanup drain instead of deleting a path twice', async () => {
    let resolve!: () => void
    const remove = vi.fn(() => new Promise<void>((done) => { resolve = done }))
    const tracker = new UnpersistedContentAssetTracker({ entity: 'blog', assetScope: scope, remove })
    tracker.track(path('00000000-0000-4000-8000-000000000099'))
    const first = tracker.cleanup()
    const second = tracker.cleanup()
    expect(first).toBe(second)
    expect(remove).toHaveBeenCalledTimes(1)
    resolve()
    await first
  })
})
