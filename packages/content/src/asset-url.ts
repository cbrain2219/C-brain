import type { ContentEntity } from './types.ts'

export const CONTENT_STORAGE_BUCKET = 'public-assets' as const

const contentEntities = new Set<ContentEntity>(['blog', 'notice', 'portfolio', 'review'])
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu
const absoluteHttpUrlPattern =
  /^([a-z][a-z0-9+.-]*):\/\/([^/?#]*)([^?#]*)(?:\?[^#]*)?(?:#.*)?$/iu
const hiddenUrlCodePoints = /[\p{Cf}\p{Z}]/u
const encodedUnsafeUrlCodePoints = /%(?:0[0-9a-f]|1[0-9a-f]|7f)/iu

export class ContentAssetScopeError extends Error {
  readonly name = 'ContentAssetScopeError'
  readonly assetScope: unknown

  constructor(assetScope: unknown) {
    super('A valid content asset scope UUID is required.')
    this.assetScope = assetScope
  }
}

export function isContentAssetScope(value: unknown): value is string {
  return typeof value === 'string' && uuidPattern.test(value)
}

export function parseContentAssetScope(value: unknown): string {
  if (!isContentAssetScope(value)) throw new ContentAssetScopeError(value)
  return value.toLowerCase()
}

function assertContentEntity(entity: ContentEntity): void {
  if (!contentEntities.has(entity)) throw new Error('A supported content entity is required.')
}

export function contentAssetObjectPrefix(entity: ContentEntity, assetScope: string): string {
  assertContentEntity(entity)
  return `content/${entity}/${parseContentAssetScope(assetScope)}/`
}

function containsUnsafeUrlCodePoint(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index)
    if (
      codeUnit <= 0x1f ||
      (codeUnit >= 0x7f && codeUnit <= 0x9f) ||
      codeUnit === 0x5c ||
      hiddenUrlCodePoints.test(value[index] ?? '')
    ) {
      return true
    }
  }
  return false
}

function hasDotSegmentAlias(pathname: string): boolean {
  return pathname.split('/').some((segment) => {
    const decodedDots = segment.replace(/%2e/giu, '.')
    return decodedDots === '.' || decodedDots === '..'
  })
}

function isCanonicalIpv4Loopback(hostname: string): boolean {
  const octets = hostname.split('.')
  return (
    octets.length === 4 &&
    octets[0] === '127' &&
    octets.every(
      (octet) => /^(?:0|[1-9][0-9]{0,2})$/u.test(octet) && Number(octet) <= 255,
    )
  )
}

/** Parses only canonical HTTPS URLs and local Supabase loopback HTTP URLs. */
export function parseAllowedAssetHttpUrl(value: unknown): URL | null {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    containsUnsafeUrlCodePoint(value) ||
    encodedUnsafeUrlCodePoints.test(value)
  ) {
    return null
  }

  let url: URL
  try {
    url = new URL(value)
  } catch {
    return null
  }

  const rawParts = absoluteHttpUrlPattern.exec(value)
  if (
    !rawParts ||
    `${rawParts[1]?.toLowerCase()}:` !== url.protocol ||
    rawParts[2] !== url.host ||
    url.hostname.length === 0 ||
    url.hostname.endsWith('.') ||
    url.username.length > 0 ||
    url.password.length > 0 ||
    hasDotSegmentAlias(rawParts[3] ?? '')
  ) {
    return null
  }

  if (url.protocol === 'https:') return url
  if (url.protocol !== 'http:') return null

  return url.hostname === 'localhost' ||
    url.hostname === '[::1]' ||
    isCanonicalIpv4Loopback(url.hostname)
    ? url
    : null
}

function parseCanonicalSupabaseUrl(value: string): URL {
  if (value.includes('?') || value.includes('#')) {
    throw new Error('A canonical Supabase URL is required.')
  }

  const url = parseAllowedAssetHttpUrl(value)
  if (!url || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('A canonical Supabase URL is required.')
  }
  url.search = ''
  url.hash = ''
  return url
}

export function createContentAssetBaseUrl(input: {
  readonly assetScope: string
  readonly entity: ContentEntity
  readonly supabaseUrl: string
}): string {
  const prefix = contentAssetObjectPrefix(input.entity, input.assetScope)
  const url = parseCanonicalSupabaseUrl(input.supabaseUrl)
  url.pathname = `/${[
    'storage',
    'v1',
    'object',
    'public',
    CONTENT_STORAGE_BUCKET,
    ...prefix.slice(0, -1).split('/'),
  ]
    .map(encodeURIComponent)
    .join('/')}/`
  return url.toString()
}

function canonicalPublicStorageObjectUrl(
  supabaseUrl: string,
  objectPath: string,
): string | null {
  const segments = objectPath.split('/')
  if (
    objectPath.length === 0 ||
    objectPath.startsWith('/') ||
    segments.some((segment) => segment.length === 0 || segment === '.' || segment === '..')
  ) {
    return null
  }

  try {
    const url = parseCanonicalSupabaseUrl(supabaseUrl)
    url.pathname = `/${[
      'storage',
      'v1',
      'object',
      'public',
      CONTENT_STORAGE_BUCKET,
      ...segments,
    ]
      .map(encodeURIComponent)
      .join('/')}`
    return url.toString()
  } catch {
    return null
  }
}

/** Returns true only for one canonical public Storage object URL. */
export function isExactPublicStorageObjectUrl(
  value: unknown,
  input: { readonly objectPath: string; readonly supabaseUrl: string },
): value is string {
  if (typeof value !== 'string' || !parseAllowedAssetHttpUrl(value)) return false
  const expected = canonicalPublicStorageObjectUrl(input.supabaseUrl, input.objectPath)
  return expected !== null && value === expected
}

/** Returns true only for a body-image URL owned by the supplied entity and record scope. */
export function isOwnedContentAssetUrl(
  value: unknown,
  input: { readonly assetScope: string; readonly entity: ContentEntity; readonly supabaseUrl: string },
): value is string {
  try {
    const prefix = contentAssetObjectPrefix(input.entity, input.assetScope)
    const url = parseAllowedAssetHttpUrl(value)
    if (!url) return false

    const storagePrefix = `/storage/v1/object/public/${CONTENT_STORAGE_BUCKET}/${prefix}images/`
    if (!url.pathname.startsWith(storagePrefix)) return false

    const objectPath = decodeURIComponent(url.pathname.slice(
      `/storage/v1/object/public/${CONTENT_STORAGE_BUCKET}/`.length,
    ))
    return isExactPublicStorageObjectUrl(value, {
      objectPath,
      supabaseUrl: input.supabaseUrl,
    })
  } catch {
    return false
  }
}
