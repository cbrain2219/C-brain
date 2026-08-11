import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(
  new URL('../src/pages/ProductFormFields.tsx', import.meta.url),
  'utf8',
)
const styles = await readFile(
  new URL('../src/pages/ProductFormFields.css', import.meta.url),
  'utf8',
)

test('product form composes fixed common and conditional sections', () => {
  const typeHeading = source.indexOf('I. 유형 선택')
  const serviceEditor = source.indexOf('<ServiceSelectionEditor')

  assert.ok(typeHeading >= 0)
  assert.ok(serviceEditor > typeHeading)
  assert.match(source, /options=\{productTypes\}/)
  assert.match(source, /readOnly/)
  assert.doesNotMatch(source, /allowCustomValue/)
  assert.match(source, /getProductUiProfile\(/)
  assert.match(source, /profile\?\.sections\.map/)
  assert.match(source, /formatProductSectionHeading\(index, section\.label\)/)
  assert.match(source, /<OptionValuesEditor/)
  assert.match(source, /<QuantityPriceEditor/)
  assert.match(source, /ProductFormDraft/)
  assert.match(source, /onProductTypeChange\(value\)/)
  assert.match(source, /getActiveProductUiDraft\(draft\)/)
  assert.match(
    source,
    /replaceActiveProductUiDraft\(draft, nextVariantDraft\)/,
  )
})

test('option selection controls product-specific price and service rows', () => {
  assert.match(source, /selectedIndex=\{selectedIndex\}/)
  assert.match(source, /onSelect=\{\(nextSelectedIndex\) =>/)
  assert.match(source, /getProductPriceKey\(draft\)/)
  assert.match(source, /draft\.priceRowsBySelection\[priceKey\]/)
  assert.match(source, /removeProductPriceOption\(/)
  assert.match(source, /removeProductServiceOption\(/)
  assert.match(source, /getProductServiceKey\(activeDraft\)/)
  assert.match(source, /activeDraft\.serviceEstimatesBySelection\[/)
})

test('product form fields stay inside the UI boundary', () => {
  assert.doesNotMatch(source, /@repo\/supabase/)
  assert.doesNotMatch(source, /createProduct|updateProduct|deleteProduct/)
  assert.doesNotMatch(source, /fetch\(/)
  assert.doesNotMatch(source, /onSubmit=/)
})

test('compound types use the Figma segmented subtype selector', () => {
  assert.match(source, /getProductVariants\(draft\.productType\)/)
  assert.match(source, /name="productSubtype"/)
  assert.match(source, /checked=\{draft\.activeVariant === variant\}/)
  assert.match(source, /selectProductFormVariant\(draft, variant\)/)
  assert.doesNotMatch(source, /changeProductUiSubtype\(/)
  assert.doesNotMatch(source, /createProductUiDraft\([^)]*variant/)
  assert.match(source, /type="radio"/)
  assert.match(
    styles,
    /\.product-ui-subtype-options\s*\{[^}]*height:\s*52px;[^}]*padding:\s*4px;[^}]*border-radius:\s*16px;[^}]*gap:\s*4px;/s,
  )
  assert.match(
    styles,
    /\.product-ui-subtype-option\s*\{[^}]*height:\s*44px;[^}]*flex:\s*1 1 0;[^}]*border-radius:\s*14px;/s,
  )
  assert.match(
    styles,
    /\.product-ui-subtype-option--selected\s*\{[^}]*background:\s*var\(--admin-brand-500\);[^}]*color:\s*var\(--admin-text-inverse\);[^}]*font-weight:\s*700;/s,
  )
})
