import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const adminAssetsSource = await readFile(
  new URL('../src/lib/adminAssets.ts', import.meta.url),
  'utf8',
)

test('public asset uploads use an immutable one-year browser cache', () => {
  assert.match(
    adminAssetsSource,
    /uploadFile[\s\S]*?cacheControl:\s*'31536000'/,
  )
})
