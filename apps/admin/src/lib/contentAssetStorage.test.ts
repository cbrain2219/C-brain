import { describe, expect, it, vi } from 'vitest'

vi.mock('./supabase', () => ({ supabase: {} }))

import {
  CONTENT_STORAGE_BUCKET,
  contentImageMaxSizeBytes,
  isContentImagePublicUrlOwnedBy,
  removeContentAsset,
  removeContentAssetScope,
  uploadContentAsset,
  validateEditorImage,
  type BrowserStorageClient,
} from './contentAssetStorage'

const scope = '00000000-0000-4000-8000-000000000001'
const origin = 'https://project.supabase.co'

vi.stubEnv('VITE_SUPABASE_URL', origin)

function image(name: string, type: string, size = 4): File {
  const file = new File(['image'], name, { type })
  Object.defineProperty(file, 'size', { configurable: true, value: size })
  return file
}

function storageClient(options: { readonly path?: string; readonly publicUrl?: string; readonly listed?: Record<string, readonly { readonly id: string | null; readonly name: string }[]> } = {}) {
  const upload = vi.fn(async (path: string) => ({ data: { path: options.path ?? path }, error: null }))
  const remove = vi.fn(async (paths: readonly string[]) => {
    void paths
    return { data: [], error: null }
  })
  const list = vi.fn(async (path: string, request: { readonly offset: number }) => {
    void request
    return { data: options.listed?.[path] ?? [], error: null }
  })
  const getPublicUrl = vi.fn((path: string) => ({
    data: { publicUrl: options.publicUrl ?? `${origin}/storage/v1/object/public/${CONTENT_STORAGE_BUCKET}/${path}` },
  }))
  const from = vi.fn(() => ({ getPublicUrl, list, remove, upload }))
  return { client: { storage: { from } } as unknown as BrowserStorageClient, getPublicUrl, list, remove, upload }
}

describe('content image storage', () => {
  it('accepts only PNG, JPEG, and WEBP at most 10 MiB', () => {
    expect(validateEditorImage(image('photo.jpeg', 'image/jpeg'))).toEqual({ ok: true, extension: 'jpg' })
    expect(validateEditorImage(image('photo.svg', 'image/svg+xml')).ok).toBe(false)
    expect(validateEditorImage(image('large.png', 'image/png', contentImageMaxSizeBytes + 1))).toEqual({ ok: false, reason: 'file_too_large' })
  })

  it('requires the exact configured public object URL and immutable image filename', () => {
    const url = `${origin}/storage/v1/object/public/${CONTENT_STORAGE_BUCKET}/content/blog/${scope}/images/00000000-0000-4000-8000-000000000099.png`
    expect(isContentImagePublicUrlOwnedBy('blog', scope, url)).toBe(true)
    expect(isContentImagePublicUrlOwnedBy('blog', scope, `${url}?cache=1`)).toBe(false)
    expect(isContentImagePublicUrlOwnedBy('blog', scope, url.replace(`/${scope}/`, '/00000000-0000-4000-8000-000000000002/'))).toBe(false)
    expect(isContentImagePublicUrlOwnedBy('notice', scope, url)).toBe(false)
  })

  it('uses one immutable path, upsert false, and cleans the exact generated object for URL/path mismatches', async () => {
    const valid = storageClient()
    const uploaded = await uploadContentAsset('blog', scope, image('hero.png', 'image/png'), valid.client)
    expect(valid.upload).toHaveBeenCalledWith(
      uploaded.path,
      expect.any(File),
      { cacheControl: '31536000', contentType: 'image/png', upsert: false },
    )
    expect(uploaded.path).toMatch(new RegExp(`^content/blog/${scope}/images/[0-9a-f-]+\\.png$`))
    expect(uploaded.alt).toBe('hero')

    const invalid = storageClient({ publicUrl: 'https://attacker.example/image.png' })
    await expect(uploadContentAsset('blog', scope, image('hero.png', 'image/png'), invalid.client)).rejects.toThrow('non-canonical')
    const expectedPath = invalid.upload.mock.calls[0]?.[0]
    expect(invalid.remove).toHaveBeenCalledWith([expectedPath])

    const pathMismatch = storageClient({ path: `content/blog/${scope}/images/00000000-0000-4000-8000-000000000099.png` })
    await expect(uploadContentAsset('blog', scope, image('hero.png', 'image/png'), pathMismatch.client)).rejects.toThrow('non-canonical')
    expect(pathMismatch.remove).toHaveBeenCalledWith([pathMismatch.upload.mock.calls[0]?.[0]])
  })

  it('cannot remove arbitrary paths and lists/removes only the record scope through Storage API', async () => {
    const client = storageClient({
      listed: {
        [`content/blog/${scope}`]: [{ id: null, name: 'images' }],
        [`content/blog/${scope}/images`]: [{ id: 'object', name: '00000000-0000-4000-8000-000000000099.webp' }],
      },
    })
    await expect(removeContentAsset('blog', scope, `content/blog/${scope}/images/not-a-uuid.png`, client.client)).rejects.toThrow('invalid_storage_path')
    await expect(removeContentAsset('blog', scope, `content/blog/00000000-0000-4000-8000-000000000002/images/00000000-0000-4000-8000-000000000099.webp`, client.client)).rejects.toThrow('invalid_storage_path')

    await expect(removeContentAssetScope('blog', scope, client.client)).resolves.toEqual([
      `content/blog/${scope}/images/00000000-0000-4000-8000-000000000099.webp`,
    ])
    expect(client.remove).toHaveBeenCalledWith([
      `content/blog/${scope}/images/00000000-0000-4000-8000-000000000099.webp`,
    ])
  })

  it('paginates scope listing and batches Storage deletes at the API limit', async () => {
    const client = storageClient()
    const root = `content/blog/${scope}`
    const entries = Array.from({ length: 1_001 }, (_, index) => ({ id: `id-${index}`, name: `asset-${index}` }))
    client.list.mockImplementation(async (path, options) => ({
      data: path === root ? entries.slice(options.offset, options.offset + 1_000) : [],
      error: null,
    }))
    const removed = await removeContentAssetScope('blog', scope, client.client)
    expect(removed).toHaveLength(1_001)
    expect(client.list).toHaveBeenCalledWith(root, expect.objectContaining({ offset: 0 }))
    expect(client.list).toHaveBeenCalledWith(root, expect.objectContaining({ offset: 1_000 }))
    expect(client.remove).toHaveBeenCalledTimes(2)
    expect(client.remove.mock.calls[0]?.[0]).toHaveLength(1_000)
    expect(client.remove.mock.calls[1]?.[0]).toHaveLength(1)
  })
})
