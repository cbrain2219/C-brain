import { contentAssetObjectPrefix, parseContentAssetScope } from '@repo/content/asset-url'
import type { ContentEntity } from '@repo/content/types'
import { removeContentAsset } from './contentAssetStorage'

export type ContentAssetPathRemover = (
  entity: ContentEntity,
  assetScope: string,
  path: string,
) => Promise<void>

export type UnpersistedContentAssetCleanupResult = {
  readonly failed: readonly { readonly error: unknown; readonly path: string }[]
  readonly removed: readonly string[]
}

export type UnpersistedContentAssetTrackerInput = {
  readonly assetScope: string
  readonly entity: ContentEntity
  readonly remove?: ContentAssetPathRemover
}

const immutableImageName =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp)$/iu

function isExactImagePath(entity: ContentEntity, assetScope: string, path: unknown): path is string {
  if (typeof path !== 'string') return false
  const prefix = `${contentAssetObjectPrefix(entity, assetScope)}images/`
  return path.startsWith(prefix) && immutableImageName.test(path.slice(prefix.length))
}

/**
 * Tracks uploads that exist in Storage but have not yet been committed by a
 * successful database write. One tracker belongs to exactly one immutable
 * content asset scope; dispose it on unmount or a document/scope change.
 */
export class UnpersistedContentAssetTracker {
  private cleanupPromise: Promise<UnpersistedContentAssetCleanupResult> | null = null
  private readonly paths = new Set<string>()
  private readonly remove: ContentAssetPathRemover
  readonly assetScope: string
  readonly entity: ContentEntity

  constructor(input: UnpersistedContentAssetTrackerInput) {
    this.assetScope = parseContentAssetScope(input.assetScope)
    this.entity = input.entity
    this.remove = input.remove ?? removeContentAsset
  }

  /** Adds one exact path once. Invalid, sibling-scope, and non-image paths are ignored. */
  track(path: unknown): boolean {
    if (!isExactImagePath(this.entity, this.assetScope, path)) return false
    const known = this.paths.has(path)
    this.paths.add(path)
    return !known
  }

  /** Snapshot for diagnostics/action locking; callers cannot mutate tracker state. */
  pendingPaths(): readonly string[] {
    return [...this.paths]
  }

  /**
   * Call immediately after the DB mutation succeeds. This is synchronous so
   * later unmount cleanup cannot delete assets that are now persisted.
   */
  commit(): void {
    this.paths.clear()
  }

  /**
   * Attempts every currently unpersisted path. Successful removals are
   * forgotten; failures remain tracked for a later retry. Concurrent callers
   * share one drain rather than issuing duplicate Storage deletes.
   */
  cleanup(): Promise<UnpersistedContentAssetCleanupResult> {
    if (this.cleanupPromise) return this.cleanupPromise

    const paths = [...this.paths]
    this.cleanupPromise = Promise.all(paths.map(async (path) => {
      try {
        await this.remove(this.entity, this.assetScope, path)
        this.paths.delete(path)
        return { kind: 'removed' as const, path }
      } catch (error) {
        return { error, kind: 'failed' as const, path }
      }
    })).then((outcomes) => {
      const removed: string[] = []
      const failed: Array<{ error: unknown; path: string }> = []
      for (const outcome of outcomes) {
        if (outcome.kind === 'removed') removed.push(outcome.path)
        else failed.push({ error: outcome.error, path: outcome.path })
      }
      return { failed, removed }
    }).finally(() => {
      this.cleanupPromise = null
    })

    return this.cleanupPromise
  }
}
