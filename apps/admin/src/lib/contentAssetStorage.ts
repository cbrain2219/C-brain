import {
  CONTENT_STORAGE_BUCKET,
  contentAssetObjectPrefix,
  isExactPublicStorageObjectUrl,
  parseAllowedAssetHttpUrl,
  parseContentAssetScope,
} from '@repo/content/asset-url'
import type { ContentEntity } from '@repo/content/types'
import { supabase } from './supabase'

export { CONTENT_STORAGE_BUCKET }
export type { ContentEntity }

export const contentImageMaxSizeBytes = 10 * 1024 * 1024

export type EditorImageExtension = 'jpg' | 'png' | 'webp'

export type EditorImageValidation =
  | { readonly ok: true; readonly extension: EditorImageExtension }
  | { readonly ok: false; readonly reason: 'invalid_mime_type' | 'file_too_large' }

export type UploadedEditorImage = {
  readonly alt: string
  readonly path: string
  readonly url: string
}

export type BrowserStorageBucket = {
  upload: (
    path: string,
    file: File,
    options: { readonly cacheControl: string; readonly contentType: string; readonly upsert: false },
  ) => Promise<{ readonly data: { readonly path?: unknown } | null; readonly error: unknown }>
  getPublicUrl: (path: string) => { readonly data: { readonly publicUrl?: unknown } }
  remove: (paths: readonly string[]) => Promise<{ readonly data: unknown; readonly error: unknown }>
  list: (
    path: string,
    options: { readonly limit: number; readonly offset: number; readonly sortBy: { readonly column: 'name'; readonly order: 'asc' } },
  ) => Promise<{
    readonly data: readonly { readonly id: string | null; readonly name: unknown }[] | null
    readonly error: unknown
  }>
}

export type BrowserStorageClient = {
  readonly storage: { readonly from: (bucket: typeof CONTENT_STORAGE_BUCKET) => BrowserStorageBucket }
}

export class ContentAssetStorageError extends Error {
  override readonly name = 'ContentAssetStorageError'
}

const formats = new Map<string, EditorImageExtension>([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
])

const immutableImageName =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp)$/iu
const safeRelativeSegment = /^[^/\\:%?#\p{Cc}\p{Cs}]+$/u
const pageSize = 1_000

function configuredSupabaseUrl(): string {
  const url = import.meta.env.VITE_SUPABASE_URL
  if (typeof url !== 'string' || url.length === 0) {
    throw new ContentAssetStorageError('VITE_SUPABASE_URL is required for content assets.')
  }
  return url
}

function storageError(operation: 'delete' | 'list' | 'upload', detail?: unknown): ContentAssetStorageError {
  const suffix = detail instanceof Error && detail.message ? `: ${detail.message}` : ''
  return new ContentAssetStorageError(`Content asset ${operation} failed${suffix}`)
}

function provisionalAlt(fileName: string): string {
  return fileName.replace(/\.[^.]+$/u, '')
}

function exactImagePath(entity: ContentEntity, assetScope: string, path: unknown): string | null {
  let prefix: string
  try {
    prefix = `${contentAssetObjectPrefix(entity, assetScope)}images/`
  } catch {
    return null
  }
  if (typeof path !== 'string' || !path.startsWith(prefix)) return null
  const fileName = path.slice(prefix.length)
  return immutableImageName.test(fileName) ? path : null
}

function safeListedName(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && safeRelativeSegment.test(value) && value !== '.' && value !== '..'
}

async function removePaths(bucket: BrowserStorageBucket, paths: readonly string[]): Promise<void> {
  for (let index = 0; index < paths.length; index += pageSize) {
    const batch = paths.slice(index, index + pageSize)
    if (batch.length === 0) continue
    let result: Awaited<ReturnType<BrowserStorageBucket['remove']>>
    try {
      result = await bucket.remove(batch)
    } catch (error) {
      throw storageError('delete', error)
    }
    if (result.error) throw storageError('delete', result.error)
  }
}

async function removeAfterRejectedUpload(bucket: BrowserStorageBucket, path: string): Promise<never> {
  await removePaths(bucket, [path])
  throw new ContentAssetStorageError('Storage returned a non-canonical content asset.')
}

/** Validates the only body-image formats accepted by the managed editor. */
export function validateEditorImage(file: Pick<File, 'size' | 'type'>): EditorImageValidation {
  const extension = formats.get(file.type)
  if (!extension) return { ok: false, reason: 'invalid_mime_type' }
  if (!Number.isFinite(file.size) || file.size < 0 || file.size > contentImageMaxSizeBytes) {
    return { ok: false, reason: 'file_too_large' }
  }
  return { ok: true, extension }
}

/**
 * Verifies an image URL against both the configured public Storage origin and
 * the exact immutable object name belonging to this entity/scope.
 */
export function isContentImagePublicUrlOwnedBy(
  entity: ContentEntity,
  assetScope: string,
  url: unknown,
): url is string {
  try {
    const scope = parseContentAssetScope(assetScope)
    const prefix = `${contentAssetObjectPrefix(entity, scope)}images/`
    const parsed = parseAllowedAssetHttpUrl(url)
    if (!parsed) return false
    const storagePrefix = `/storage/v1/object/public/${CONTENT_STORAGE_BUCKET}/${prefix}`
    if (!parsed.pathname.startsWith(storagePrefix)) return false
    const fileName = parsed.pathname.slice(storagePrefix.length)
    if (!immutableImageName.test(fileName)) return false
    const path = `${prefix}${fileName}`
    return isExactPublicStorageObjectUrl(url, { objectPath: path, supabaseUrl: configuredSupabaseUrl() })
  } catch {
    return false
  }
}

/** Uploads one immutable body image. The server-returned path and URL must be exact. */
export async function uploadContentAsset(
  entity: ContentEntity,
  assetScope: string,
  file: File,
  client: BrowserStorageClient = supabase as unknown as BrowserStorageClient,
): Promise<UploadedEditorImage> {
  const scope = parseContentAssetScope(assetScope)
  const validation = validateEditorImage(file)
  if (!validation.ok) throw new ContentAssetStorageError(validation.reason)

  const path = `${contentAssetObjectPrefix(entity, scope)}images/${crypto.randomUUID().toLowerCase()}.${validation.extension}`
  const bucket = client.storage.from(CONTENT_STORAGE_BUCKET)
  let result: Awaited<ReturnType<BrowserStorageBucket['upload']>>
  try {
    result = await bucket.upload(path, file, {
      cacheControl: '31536000',
      contentType: file.type,
      upsert: false,
    })
  } catch (error) {
    throw storageError('upload', error)
  }
  if (result.error) throw storageError('upload', result.error)
  if (result.data?.path !== path || exactImagePath(entity, scope, result.data.path) !== path) {
    return removeAfterRejectedUpload(bucket, path)
  }

  let url: unknown
  try {
    url = bucket.getPublicUrl(path).data.publicUrl
  } catch (error) {
    await removePaths(bucket, [path])
    throw storageError('upload', error)
  }
  if (!isContentImagePublicUrlOwnedBy(entity, scope, url)) {
    return removeAfterRejectedUpload(bucket, path)
  }
  return { alt: provisionalAlt(file.name), path, url }
}

/** Deletes one exact immutable image path; sibling scopes and arbitrary paths are rejected. */
export async function removeContentAsset(
  entity: ContentEntity,
  assetScope: string,
  path: string,
  client: BrowserStorageClient = supabase as unknown as BrowserStorageClient,
): Promise<void> {
  const scope = parseContentAssetScope(assetScope)
  if (exactImagePath(entity, scope, path) !== path) {
    throw new ContentAssetStorageError('invalid_storage_path')
  }
  await removePaths(client.storage.from(CONTENT_STORAGE_BUCKET), [path])
}

async function listScopePaths(bucket: BrowserStorageBucket, prefix: string): Promise<string[]> {
  const roots: Array<{ readonly directory: string; readonly relative: string }> = [
    { directory: prefix.slice(0, -1), relative: '' },
  ]
  const paths: string[] = []

  for (let rootIndex = 0; rootIndex < roots.length; rootIndex += 1) {
    const root = roots[rootIndex]
    if (!root) continue
    for (let offset = 0; ; offset += pageSize) {
      let result: Awaited<ReturnType<BrowserStorageBucket['list']>>
      try {
        result = await bucket.list(root.directory, {
          limit: pageSize,
          offset,
          sortBy: { column: 'name', order: 'asc' },
        })
      } catch (error) {
        throw storageError('list', error)
      }
      if (result.error || !result.data) throw storageError('list', result.error)
      for (const entry of result.data) {
        if (!safeListedName(entry.name)) throw new ContentAssetStorageError('Storage returned an unsafe content asset path.')
        const relative = root.relative ? `${root.relative}/${entry.name}` : entry.name
        if (entry.id === null) roots.push({ directory: `${root.directory}/${entry.name}`, relative })
        else paths.push(`${prefix}${relative}`)
      }
      if (result.data.length < pageSize) break
    }
  }
  return paths
}

/** Best-effort record deletion can call this after the row is gone; it cannot leave the record scope. */
export async function removeContentAssetScope(
  entity: ContentEntity,
  assetScope: string,
  client: BrowserStorageClient = supabase as unknown as BrowserStorageClient,
): Promise<readonly string[]> {
  const scope = parseContentAssetScope(assetScope)
  const prefix = contentAssetObjectPrefix(entity, scope)
  const bucket = client.storage.from(CONTENT_STORAGE_BUCKET)
  const paths = await listScopePaths(bucket, prefix)
  await removePaths(bucket, paths)
  return paths
}
