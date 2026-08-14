import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { createPublicAssetPath } from '../src/lib/publicAssetPath.ts'

const portfolioFormPath = new URL('../src/pages/PortfolioFormPage.tsx', import.meta.url)

test('public asset paths preserve the original file name inside a unique folder', () => {
  const fileName = '씨브레인 회사소개서 최종본.jpg'
  const options = { preserveOriginalFileName: true }
  const firstPath = createPublicAssetPath('portfolio', fileName, options)
  const secondPath = createPublicAssetPath('portfolio', fileName, options)

  assert.match(
    firstPath,
    /^portfolio\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\//,
  )
  assert.equal(firstPath.split('/').at(-1), fileName)
  assert.notEqual(firstPath, secondPath)
})

test('other public assets keep their existing UUID file name strategy', () => {
  assert.match(
    createPublicAssetPath('reviews', '인터뷰 원본 영상.MP4'),
    /^reviews\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.mp4$/,
  )
})

test('portfolio image chip prefers the selected or stored original file name', async () => {
  const formSource = await readFile(portfolioFormPath, 'utf8')

  assert.match(
    formSource,
    /slot\.file\?\.name \?\? slot\.path\?\.split\('\/'\)\.pop\(\) \?\? '선택한 이미지'/,
  )
  assert.match(formSource, /preserveOriginalFileName: true/)
})
