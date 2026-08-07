import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const productFormUiSource = await readFile(
  new URL('../src/pages/ProductFormUiPage.tsx', import.meta.url),
  'utf8',
)
const appSource = await readFile(
  new URL('../src/App.tsx', import.meta.url),
  'utf8',
)
const comboboxCssSource = await readFile(
  new URL(
    '../src/components/admin-form/AdminTypeCombobox.css',
    import.meta.url,
  ),
  'utf8',
)

test('new product form ui cannot mutate product data yet', () => {
  assert.doesNotMatch(productFormUiSource, /@repo\/supabase/)
  assert.doesNotMatch(
    productFormUiSource,
    /\b(?:createProduct|updateProduct|deleteProduct)\b/,
  )
  assert.match(productFormUiSource, /현재 UI만 적용되어 저장되지 않습니다\./)
  assert.match(productFormUiSource, /<AdminFooter/)
  assert.match(productFormUiSource, /useParams/)
  assert.match(appSource, /import\.meta\.env\.DEV/)
  assert.match(appSource, /path="\/products\/ui-preview"/)
})

test('new product ui is applied to both product form routes', () => {
  assert.match(
    appSource,
    /element=\{<ProductFormUiPage \/>\} path="\/products\/new"/,
  )
  assert.match(
    appSource,
    /element=\{<ProductFormUiPage \/>\} path="\/products\/:productId"/,
  )
  assert.doesNotMatch(appSource, /ProductFormPage/)
})

test('brochure preview gets spreadsheet prices from its draft factory', () => {
  assert.match(
    productFormUiSource,
    /createProductUiDraft\(["']브로슈어 · 카탈로그["']\)/,
  )
  assert.doesNotMatch(productFormUiSource, /designPrintEstimate:\s*'80,000'/)
  assert.doesNotMatch(productFormUiSource, /planningEstimate:\s*'50,000'/)
  assert.doesNotMatch(productFormUiSource, /unitPrice:\s*'2,100'/)
})

test('product type dropdown keeps scrolling while hiding its scrollbar', () => {
  assert.match(comboboxCssSource, /overflow-y:\s*auto/)
  assert.match(comboboxCssSource, /scrollbar-width:\s*none/)
  assert.match(comboboxCssSource, /__menu::\-webkit-scrollbar/)
})
