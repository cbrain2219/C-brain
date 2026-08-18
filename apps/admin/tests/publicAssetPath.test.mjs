import assert from 'node:assert/strict'
import test from 'node:test'
import { createPublicAssetPath } from '../src/lib/publicAssetPath.ts'

test('public asset paths replace a Korean original name with a storage-safe UUID name', () => {
  const fileName = '씨브레인 회사소개서 최종본.jpg'
  const firstPath = createPublicAssetPath('portfolio', fileName)
  const secondPath = createPublicAssetPath('portfolio', fileName)

  assert.match(
    firstPath,
    /^portfolio\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.jpg$/,
  )
  assert.doesNotMatch(firstPath, /[^\x00-\x7F]/)
  assert.notEqual(firstPath, secondPath)
})

test('other public assets keep their existing UUID file name strategy', () => {
  assert.match(
    createPublicAssetPath('reviews', '인터뷰 원본 영상.MP4'),
    /^reviews\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.mp4$/,
  )
})
