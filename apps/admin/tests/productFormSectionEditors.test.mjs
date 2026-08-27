import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(
  new URL('../src/pages/ProductFormSectionEditors.tsx', import.meta.url),
  'utf8',
)
const iconSource = await readFile(
  new URL('../src/components/AdminIcon.tsx', import.meta.url),
  'utf8',
)
const styles = await readFile(
  new URL('../src/pages/ProductFormFields.css', import.meta.url),
  'utf8',
)

test('section editors use semantic controls and shared icons', () => {
  assert.match(source, /export function ServiceSelectionEditor/)
  assert.match(source, /export function OptionValuesEditor/)
  assert.match(source, /export function QuantityPriceEditor/)
  assert.match(source, /<fieldset/)
  assert.match(source, /<legend/)
  assert.match(source, /<AdminIcon name="plus"/)
  assert.match(source, /<AdminIcon name="x-close"/)
  assert.match(source, /aria-label=\{`\$\{heading\} 항목 추가`\}/)
  assert.match(source, /수량 및 단위를 입력해주세요\./)
  assert.match(source, /인쇄 단가를 입력해주세요\./)
  assert.match(source, /인쇄비 합계를 입력해주세요\./)
  assert.match(source, /field="unitPrice"/)
  assert.match(source, /field="printAmount"/)
  assert.match(source, /인쇄 단가\(원\/단위\)/)
  assert.match(source, /합계\(원\)/)
  assert.match(source, /formatDecimalNumericValue/)
  assert.match(source, /formatFixedDecimalNumericValue/)
  assert.match(source, /onBlur=/)
  assert.match(source, /inputMode=\{field === 'unitPrice' \? 'decimal' : 'numeric'\}/)
  assert.doesNotMatch(source, /최종견적가/)
  assert.match(styles, /grid-template-columns:\s*repeat\(3,/)
  assert.match(source, /data-product-service-input/)
  assert.match(source, /data-product-option-key=\{optionKey\}/)
  assert.match(source, /data-product-price-field=\{field\}/)
  assert.match(source, /required/)
  assert.doesNotMatch(source, /figma\.com\/api/)
})

test('plus icon inherits currentColor from AdminIcon', () => {
  assert.match(iconSource, /plus:\s*\{/)
  assert.match(iconSource, /M8 3\.2V12\.8M3\.2 8H12\.8/)
  assert.match(iconSource, /stroke="currentColor"/)
})

test('section spacing and option controls match the Figma measurements', () => {
  assert.match(styles, /fieldset\.product-ui-section\s*{[^}]*margin:\s*0;/s)
  assert.match(
    styles,
    /fieldset\.product-ui-section\s*>\s*\.product-ui-section__legend\s*{[^}]*padding-bottom:\s*20px;/s,
  )
  assert.match(
    styles,
    /\.product-ui-control--option\s*{[^}]*min-width:\s*64px;[^}]*gap:\s*0;[^}]*font-weight:\s*700;/s,
  )
  assert.match(
    styles,
    /\.product-ui-control__input--option\s*{[^}]*min-width:\s*0;[^}]*field-sizing:\s*content;/s,
  )
})

test('unselected options select before exposing their editable input', () => {
  assert.match(source, /selectedIndex: number/)
  assert.match(source, /onSelect: \(index: number\) => void/)
  assert.match(source, /const isSelected = index === selectedIndex/)
  assert.match(
    source,
    /className="product-ui-control product-ui-control--option product-ui-control--selectable"/,
  )
  assert.match(source, /onClick=\{\(\) => onSelect\(index\)\}/)
  assert.match(source, /aria-label=\{`\$\{heading\} \$\{index \+ 1\} 선택`\}/)
  assert.doesNotMatch(
    source,
    /index === 0\s*\?[^:]*product-ui-control--selected/s,
  )
  assert.match(
    styles,
    /\.product-ui-control--selectable\s*\{[^}]*cursor:\s*pointer;/s,
  )
  assert.match(
    styles,
    /\.product-ui-control__value--placeholder\s*\{[^}]*color:/s,
  )
})

test('option and price remove buttons share the same visible treatment', () => {
  assert.match(source, /<AdminIcon name="x-close" size=\{16\}/)
  assert.match(
    styles,
    /\.product-ui-option-row\s*>\s*\.product-ui-remove-button,\s*\.product-ui-price-row\s*>\s*\.product-ui-remove-button\s*\{[^}]*top:\s*-8px;[^}]*right:\s*-8px;[^}]*width:\s*20px;[^}]*height:\s*20px;[^}]*color:\s*var\(--color-gray-900\);[^}]*opacity:\s*1;/s,
  )
  assert.match(
    styles,
    /\.product-ui-remove-button\s*\{[^}]*border:\s*1px solid var\(--color-gray-900\);[^}]*color:\s*var\(--color-gray-900\);/s,
  )
  assert.doesNotMatch(styles, /\.product-ui-remove-button--price\s*\{\s*right:/)
})
