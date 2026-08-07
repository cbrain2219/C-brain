import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createProductUiDraft,
  formatProductSectionHeading,
  getProductPriceKey,
  getProductPriceSelectionIndexes,
  getProductPriceSelectionKeys,
  getProductServiceKey,
  getProductServiceSelectionIndexes,
  getProductServiceSelectionKeys,
  getProductUiProfile,
  getProductVariants,
  productSubtypeOptions,
  productTypes,
  removeProductPriceOption,
  removeProductServiceOption,
} from '../src/pages/productFormUi.ts'

const headings = (type, subtype = '') =>
  getProductUiProfile(type, subtype).sections.map((section, index) =>
    formatProductSectionHeading(index, section.label),
  )

test('product types are fixed in display order', () => {
  assert.deepEqual(productTypes, [
    '브로슈어 · 카탈로그',
    '리플렛 · 팜플렛',
    '포스터 · 전단지',
    '배너 · 족자 · 현수막',
    '명함 · 봉투',
    '로고',
  ])
})

test('compound product types expose subtypes and select the first by default', () => {
  assert.deepEqual(productSubtypeOptions['포스터 · 전단지'], [
    '포스터',
    '전단지',
  ])
  assert.deepEqual(productSubtypeOptions['배너 · 족자 · 현수막'], [
    '배너',
    '족자',
    '현수막',
  ])
  assert.deepEqual(productSubtypeOptions['명함 · 봉투'], ['명함', '봉투'])

  assert.equal(createProductUiDraft('포스터 · 전단지').productSubtype, '포스터')
  assert.equal(
    createProductUiDraft('배너 · 족자 · 현수막').productSubtype,
    '배너',
  )
  assert.equal(createProductUiDraft('명함 · 봉투').productSubtype, '명함')
  assert.equal(createProductUiDraft('리플렛 · 팜플렛').productSubtype, '')
})

test('every product and subtype starts its custom sections at III', () => {
  assert.deepEqual(headings('브로슈어 · 카탈로그'), [
    'III. 페이지 수 선택',
    'IV. 용지 선택',
    'V. 두께 선택',
    'VI. 표지 코팅 선택',
    'VII. 수량 선택',
  ])
  assert.deepEqual(headings('리플렛 · 팜플렛'), [
    'III. 사이즈 선택',
    'IV. 용지 선택',
    'V. 두께 선택',
    'VI. 표지 코팅 선택',
    'VII. 수량 선택',
  ])
  assert.deepEqual(headings('포스터 · 전단지', '포스터'), [
    'III. 사이즈 선택',
    'IV. 용지',
    'V. 두께 선택',
    'VI. 코팅 선택',
    'VII. 수량 선택',
  ])
  assert.deepEqual(headings('포스터 · 전단지', '전단지'), [
    'III. 사이즈 선택',
    'IV. 용지',
    'V. 두께 선택',
    'VI. 면 선택',
    'VII. 수량 선택',
  ])
  assert.deepEqual(headings('배너 · 족자 · 현수막', '족자'), [
    'III. 사이즈 선택',
    'IV. 재질 선택',
    'V. 족자봉',
    'VI. S고리',
    'VII. 수량 선택',
  ])
  assert.deepEqual(headings('배너 · 족자 · 현수막', '현수막'), [
    'III. 사이즈',
    'IV. 재질',
    'V. 재단',
    'VI. 사용 환경',
    'VII. 수량 선택',
  ])
  assert.deepEqual(headings('명함 · 봉투', '봉투'), [
    'III. 종류',
    'IV. 재질',
    'V. 두께 선택',
    'VI. 수량 선택',
  ])
  assert.deepEqual(headings('로고'), ['III. 유형', 'IV. 시안 개수'])
})

test('new drafts contain blank structure without product data', () => {
  for (const productType of productTypes) {
    for (const variant of getProductVariants(productType)) {
      const subtype = variant === productType ? '' : variant
      const draft = createProductUiDraft(productType, subtype)
      const optionKeys = getProductUiProfile(productType, subtype)
        .sections.filter((section) => section.kind === 'options')
        .map((section) => section.key)

      assert.deepEqual(Object.keys(draft.optionValues), optionKeys)
      assert.ok(
        Object.values(draft.optionValues).every(
          (values) => values.length === 1 && values[0] === '',
        ),
      )
      assert.deepEqual(draft.priceRowsBySelection, {})
      assert.deepEqual(draft.serviceEstimatesBySelection, {})
    }
  }
})

test('selection keys follow the current blank or DB-backed option indexes', () => {
  const flyer = createProductUiDraft('포스터 · 전단지', '전단지')

  flyer.selectedOptionIndexes = {
    paper: 0,
    side: 1,
    size: 0,
    thickness: 1,
  }

  assert.equal(getProductPriceKey(flyer), '0:0:1:1')
  assert.equal(getProductServiceKey(flyer), '1')
})

test('selection helpers enumerate and restore every price and service combination', () => {
  const flyer = createProductUiDraft('포스터 · 전단지', '전단지')

  flyer.optionValues = {
    paper: ['일반지'],
    side: ['단면', '양면'],
    size: ['A4', 'A5'],
    thickness: ['얇은'],
  }

  assert.deepEqual(getProductPriceSelectionKeys(flyer), [
    '0:0:0:0',
    '0:0:0:1',
    '1:0:0:0',
    '1:0:0:1',
  ])
  assert.deepEqual(getProductServiceSelectionKeys(flyer), ['0', '1'])
  assert.deepEqual(getProductPriceSelectionIndexes(flyer, '1:0:0:1'), {
    paper: 0,
    side: 1,
    size: 1,
    thickness: 0,
  })
  assert.deepEqual(getProductServiceSelectionIndexes(flyer, '1'), {
    side: 1,
  })
})

test('removing an option keeps stored DB selections aligned', () => {
  const brochure = createProductUiDraft('브로슈어 · 카탈로그')
  const first = [{ quantity: '100', unitPrice: '1,000' }]
  const second = [{ quantity: '200', unitPrice: '2,000' }]
  const third = [{ quantity: '300', unitPrice: '3,000' }]

  brochure.priceRowsBySelection = {
    '0:0:0:0': first,
    '1:0:0:0': second,
    '2:0:0:0': third,
  }

  assert.deepEqual(removeProductPriceOption(brochure, 'pageCount', 0), {
    '0:0:0:0': second,
    '1:0:0:0': third,
  })

  const leaflet = createProductUiDraft('리플렛 · 팜플렛')
  leaflet.serviceEstimatesBySelection = {
    0: { designPrintEstimate: '10,000', planningEstimate: '1,000' },
    1: { designPrintEstimate: '20,000', planningEstimate: '2,000' },
    2: { designPrintEstimate: '30,000', planningEstimate: '3,000' },
  }

  assert.deepEqual(removeProductServiceOption(leaflet, 'size', 0), {
    0: { designPrintEstimate: '20,000', planningEstimate: '2,000' },
    1: { designPrintEstimate: '30,000', planningEstimate: '3,000' },
  })
})
