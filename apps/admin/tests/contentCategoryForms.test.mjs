import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const portfolioFormPath = new URL(
  '../src/pages/PortfolioFormPage.tsx',
  import.meta.url,
)
const blogFormPath = new URL('../src/pages/BlogFormPage.tsx', import.meta.url)

test('portfolio and blog forms use the fixed product category registry', async () => {
  const [portfolioSource, blogSource] = await Promise.all([
    readFile(portfolioFormPath, 'utf8'),
    readFile(blogFormPath, 'utf8'),
  ])

  for (const source of [portfolioSource, blogSource]) {
    assert.match(
      source,
      /import \{ isProductType, productTypes \} from '@repo\/supabase\/categories'/,
    )
    assert.match(source, /options=\{productTypes\}/)
    assert.match(source, /if \(!isProductType\(form\.type\)\)/)
    assert.doesNotMatch(source, /allowCustomValue/)
  }

  assert.doesNotMatch(
    portfolioSource,
    /defaultPortfolioTypes|portfolioTypes|setPortfolioTypes/,
  )
  assert.doesNotMatch(blogSource, /blogTypes|setBlogTypes/)
})
