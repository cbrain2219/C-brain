import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const portfolioFormPath = new URL(
  '../src/pages/PortfolioFormPage.tsx',
  import.meta.url,
)
const blogFormPath = new URL('../src/pages/BlogFormPage.tsx', import.meta.url)
const blogListPath = new URL('../src/pages/BlogPage.tsx', import.meta.url)

test('portfolio form uses the fixed portfolio category registry', async () => {
  const [portfolioSource, blogSource] = await Promise.all([
    readFile(portfolioFormPath, 'utf8'),
    readFile(blogFormPath, 'utf8'),
  ])

  assert.match(
    portfolioSource,
    /import \{ isPortfolioType, portfolioTypes \} from '@repo\/supabase\/categories'/,
  )
  assert.match(portfolioSource, /options=\{portfolioTypes\}/)
  assert.match(portfolioSource, /if \(!isPortfolioType\(form\.type\)\)/)
  assert.doesNotMatch(portfolioSource, /allowCustomValue/)

  assert.doesNotMatch(portfolioSource, /defaultPortfolioTypes|setPortfolioTypes/)
  assert.doesNotMatch(blogSource, /if \(!isProductType\(form\.type\)\)/)
})

test('blog form combines the fixed categories with reusable custom categories', async () => {
  const [formSource, listSource] = await Promise.all([
    readFile(blogFormPath, 'utf8'),
    readFile(blogListPath, 'utf8'),
  ])

  assert.match(formSource, /getBlogCategoryOptions/)
  assert.match(formSource, /setBlogTypes\(getBlogCategoryOptions\(posts\.map/)
  assert.match(formSource, /allowCustomValue/)
  assert.match(formSource, /options=\{blogTypes\}/)
  assert.match(formSource, /normalizeBlogCategory\(nextType\)/)
  assert.doesNotMatch(formSource, /isProductType/)
  assert.match(
    listSource,
    /options: \[blogAllCategory, \.\.\.getBlogCategoryOptions\(rows\.map/,
  )
})
