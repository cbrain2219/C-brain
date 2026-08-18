import assert from 'node:assert/strict'
import test from 'node:test'

import {
  contentAssetObjectPrefix,
  createContentAssetBaseUrl,
  isExactPublicStorageObjectUrl,
  isOwnedContentAssetUrl,
  parseAllowedAssetHttpUrl,
  parseContentAssetScope,
} from './asset-url.ts'

const scope = '00000000-0000-4000-8000-0000000000ab'

test('canonicalizes a UUID content asset scope', () => {
  assert.equal(
    parseContentAssetScope('00000000-0000-4000-8000-0000000000AB'),
    scope,
  )
  assert.equal(contentAssetObjectPrefix('blog', scope), `content/blog/${scope}/`)
})

test('rejects malformed content asset scopes', () => {
  assert.throws(() => parseContentAssetScope('../scope'))
  assert.throws(() => parseContentAssetScope('not-a-uuid'))
})

test('builds the canonical public Storage base URL', () => {
  assert.equal(
    createContentAssetBaseUrl({
      assetScope: scope,
      entity: 'review',
      supabaseUrl: 'https://project.supabase.co',
    }),
    `https://project.supabase.co/storage/v1/object/public/public-assets/content/review/${scope}/`,
  )
})

test('rejects unsafe public origins and URL aliases', () => {
  for (const value of [
    'http://project.supabase.co',
    'https://user:secret@project.supabase.co',
    'https:////project.supabase.co',
    'https://project.supabase.co/storage/../v1',
    'https://project.supabase.co/%2e%2e/storage',
  ]) {
    assert.equal(parseAllowedAssetHttpUrl(value), null, value)
  }

  for (const suffix of ['?alias=1', '?', '#fragment', '#', '?#']) {
    assert.throws(() =>
      createContentAssetBaseUrl({
        assetScope: scope,
        entity: 'blog',
        supabaseUrl: `https://project.supabase.co${suffix}`,
      }),
    )
  }
})

test('matches only exact, owned public Storage object URLs', () => {
  const objectPath = `content/blog/${scope}/images/image.webp`
  const url = `https://project.supabase.co/storage/v1/object/public/public-assets/${objectPath}`

  assert.equal(
    isExactPublicStorageObjectUrl(url, {
      objectPath,
      supabaseUrl: 'https://project.supabase.co',
    }),
    true,
  )
  assert.equal(
    isOwnedContentAssetUrl(url, {
      assetScope: scope,
      entity: 'blog',
      supabaseUrl: 'https://project.supabase.co',
    }),
    true,
  )
  assert.equal(
    isOwnedContentAssetUrl(`${url}?version=2`, {
      assetScope: scope,
      entity: 'blog',
      supabaseUrl: 'https://project.supabase.co',
    }),
    false,
  )
  assert.equal(
    isOwnedContentAssetUrl(url.replace('/blog/', '/review/'), {
      assetScope: scope,
      entity: 'blog',
      supabaseUrl: 'https://project.supabase.co',
    }),
    false,
  )
})
