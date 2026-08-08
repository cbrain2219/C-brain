import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const productFormUiSource = await readFile(
  new URL('../src/pages/ProductFormUiPage.tsx', import.meta.url),
  'utf8',
)
const productFormDataSource = await readFile(
  new URL('../src/pages/productFormUi.ts', import.meta.url),
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
const legacySubtypeColumn = ['product', 'subtype'].join('_')

test('product form loads and mutates JSONB products', () => {
  assert.match(productFormUiSource, /@repo\/supabase/)
  assert.match(productFormUiSource, /listAdminProducts/)
  assert.match(productFormUiSource, /createProduct/)
  assert.match(productFormUiSource, /updateProduct/)
  assert.match(productFormUiSource, /deleteProduct/)
  assert.match(productFormUiSource, /toProductFormDraft\(product\)/)
  assert.match(productFormUiSource, /toProductWriteInput/)
  assert.match(productFormUiSource, /getProductValidationIssue/)
  assert.match(productFormUiSource, /focusValidationIssue/)
  assert.match(productFormUiSource, /formNoValidate/)
  assert.doesNotMatch(productFormUiSource, new RegExp(legacySubtypeColumn))
  assert.match(productFormUiSource, /<AdminDeleteDialog/)
  assert.match(productFormUiSource, /상품 정보를 불러오는 중입니다\./)
  assert.doesNotMatch(
    productFormUiSource,
    /현재 UI만 적용되어 저장되지 않습니다/,
  )
  assert.match(productFormUiSource, /<AdminFooter/)
  assert.match(productFormUiSource, /useParams/)
  assert.match(appSource, /import\.meta\.env\.DEV/)
  assert.match(appSource, /path="\/products\/ui-preview"/)
  assert.match(appSource, /control\.focus\(\{ preventScroll: true \}\)/)
})

test('changing to a stored product type loads its DB-backed edit row', () => {
  assert.match(productFormUiSource, /setStoredProducts\(products\)/)
  assert.match(
    productFormUiSource,
    /product\.product_type === productType/,
  )
  assert.match(
    productFormUiSource,
    /navigate\('\/products\/' \+ storedProduct\.id, \{ replace: true \}\)/,
  )
  assert.match(
    productFormUiSource,
    /onProductTypeChange=\{handleProductTypeChange\}/,
  )
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

test('new product drafts do not bundle spreadsheet product data', () => {
  assert.match(
    productFormUiSource,
    /createProductFormDraft\(["']브로슈어 · 카탈로그["']\)/,
  )
  assert.doesNotMatch(productFormDataSource, /PriceMatrix/)
  assert.doesNotMatch(productFormDataSource, /createServiceEstimate/)
  assert.doesNotMatch(productFormDataSource, /850000|2240000|250000/)
})

test('product type dropdown keeps scrolling while hiding its scrollbar', () => {
  assert.match(comboboxCssSource, /overflow-y:\s*auto/)
  assert.match(comboboxCssSource, /scrollbar-width:\s*none/)
  assert.match(comboboxCssSource, /__menu::\-webkit-scrollbar/)
})
