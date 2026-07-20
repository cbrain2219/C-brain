import assert from 'node:assert/strict'
import test from 'node:test'
import {
  MAX_PORTFOLIO_IMAGE_BYTES,
  getPortfolioImageError,
  isValidPortfolioSlug,
} from '../src/pages/portfolioFormState.ts'

test('slug accepts English letters and hyphens only', () => {
  assert.equal(isValidPortfolioSlug('cbrain-portfolio'), true)
  assert.equal(isValidPortfolioSlug('포트폴리오-01'), false)
})

test('image validation permits allowed files at 50MB and rejects invalid files', () => {
  assert.equal(
    getPortfolioImageError({ size: MAX_PORTFOLIO_IMAGE_BYTES, type: 'image/webp' }),
    null,
  )
  assert.match(
    getPortfolioImageError({ size: 1, type: 'application/pdf' }) ?? '',
    /PNG, JPEG, WEBP/,
  )
  assert.match(
    getPortfolioImageError({ size: MAX_PORTFOLIO_IMAGE_BYTES + 1, type: 'image/png' }) ?? '',
    /50MB/,
  )
})
