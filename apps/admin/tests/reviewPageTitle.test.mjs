import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const pagePath = new URL('../src/pages/ReviewPage.tsx', import.meta.url)
const stylesPath = new URL('../src/pages/ReviewPage.css', import.meta.url)

test('review list titles preserve saved line breaks and expand their rows', async () => {
  const [pageSource, stylesSource] = await Promise.all([
    readFile(pagePath, 'utf8'),
    readFile(stylesPath, 'utf8'),
  ])

  assert.match(pageSource, /import '.\/ReviewPage\.css'/)
  assert.match(pageSource, /className="portfolio-page review-page"/)
  assert.match(
    pageSource,
    /className="admin-data-table__title-cell review-page__title-cell"/,
  )
  assert.match(
    stylesSource,
    /\.review-page__title-cell\s*{[^}]*white-space:\s*pre-line;/s,
  )
  assert.match(
    stylesSource,
    /\.review-page \.admin-data-table__cell\s*{[^}]*height:\s*auto;[^}]*min-height:\s*52px;/s,
  )
})
