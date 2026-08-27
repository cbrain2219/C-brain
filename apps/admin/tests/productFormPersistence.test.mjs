import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  getProductValidationIssue,
  getProductValidationMessage,
  toProductFormDraft,
  toProductWriteInput,
} from '../src/pages/productFormPersistence.ts'
import { createProductFormDraft } from '../src/pages/productFormGroup.ts'

const legacySubtypeColumn = ['product', 'subtype'].join('_')
const seedSql = await readFile(
  new URL('../../../supabase/seed_products.sql', import.meta.url),
  'utf8',
)
const seededVariantsJson = seedSql.match(
  /\$variants\$\n([\s\S]*?)\n\$variants\$/,
)?.[1]

assert.ok(seededVariantsJson, 'seed_products.sql variant payload is missing')

const seededVariants = JSON.parse(seededVariantsJson)
const groupedSeedProducts = Array.from(
  seededVariants
    .reduce((groups, variant) => {
      const current = groups.get(variant.product_type) ?? {
        configuration: { variants: {} },
        product_type: variant.product_type,
        sort_order: variant.sort_order,
        status: variant.status,
      }
      const variantName = variant[legacySubtypeColumn] || variant.product_type

      current.configuration.variants[variantName] = variant.configuration
      current.sort_order = Math.min(current.sort_order, variant.sort_order)
      groups.set(variant.product_type, current)

      return groups
    }, new Map())
    .values(),
).sort((left, right) => left.sort_order - right.sort_order)

function groupedProductRecord(overrides = {}) {
  return {
    configuration: {
      futureGroupFlag: true,
      variants: {
        포스터: {
          futureVariantFlag: 'keep-me',
          optionValues: {
            coating: ['무광'],
            paper: ['일반지(아트지)'],
            size: ['A1(594x841mm)'],
            thickness: ['얇은'],
          },
          priceRowsBySelection: {
            '0:0:0:0': [
              { quantity: 100, unitPrice: 2700.5, printAmount: 270050 },
            ],
          },
          serviceEstimatesBySelection: {
            '': { designPrintEstimate: 250000, planningEstimate: 200000 },
          },
        },
        전단지: {
          optionValues: {
            paper: ['일반지(아트지)'],
            side: ['단면'],
            size: ['A4(210x297mm)'],
            thickness: ['얇은'],
          },
          priceRowsBySelection: {
            '0:0:0:0': [
              { quantity: 100, unitPrice: 300, printAmount: 30000 },
            ],
          },
          serviceEstimatesBySelection: {
            0: { designPrintEstimate: 100000, planningEstimate: 60000 },
          },
        },
      },
    },
    created_at: '2026-08-07T00:00:00.000Z',
    id: 'poster-flyer-id',
    product_type: '포스터 · 전단지',
    sort_order: 3,
    status: 'draft',
    ...overrides,
  }
}

test('ten spreadsheet variants seed and round trip as six grouped products', () => {
  assert.equal(seededVariants.length, 10)
  assert.equal(groupedSeedProducts.length, 6)
  assert.deepEqual(
    groupedSeedProducts.map((product) => product.product_type),
    [
      '브로슈어 · 카탈로그',
      '리플렛 · 팜플렛',
      '포스터 · 전단지',
      '배너 · 족자 · 현수막',
      '명함 · 봉투',
      '로고',
    ],
  )
  assert.deepEqual(
    Object.keys(
      groupedSeedProducts.find(
        (product) => product.product_type === '포스터 · 전단지',
      ).configuration.variants,
    ),
    ['포스터', '전단지'],
  )
  assert.equal(
    seededVariants.reduce(
      (count, variant) =>
        count + Object.keys(variant.configuration.priceRowsBySelection).length,
      0,
    ),
    98,
  )
  assert.equal(
    seededVariants.reduce(
      (count, variant) =>
        count +
        Object.keys(variant.configuration.serviceEstimatesBySelection).length,
      0,
    ),
    17,
  )

  for (const [index, product] of groupedSeedProducts.entries()) {
    const record = {
      ...product,
      created_at: '2026-08-07T00:00:00.000Z',
      id: `seed-${index}`,
    }
    const draft = toProductFormDraft(record)
    const input = toProductWriteInput(
      draft,
      record.status,
      record.configuration,
    )

    assert.equal(input.product_type, product.product_type)
    assert.equal(input.status, product.status)
    assert.deepEqual(input.configuration, product.configuration)
  }
})

test('grouped JSONB round trips every variant and future key', () => {
  const record = groupedProductRecord()
  const draft = toProductFormDraft(record)
  const input = toProductWriteInput(draft, 'draft', record.configuration)

  assert.equal(draft.productType, '포스터 · 전단지')
  assert.deepEqual(Object.keys(draft.variants), ['포스터', '전단지'])
  assert.deepEqual(draft.variants.포스터.priceRowsBySelection['0:0:0:0'], [
    { quantity: '100', unitPrice: '2,700.5', printAmount: '270,050' },
  ])
  assert.deepEqual(draft.variants.전단지.priceRowsBySelection['0:0:0:0'], [
    { quantity: '100', unitPrice: '300.0', printAmount: '30,000' },
  ])
  assert.deepEqual(input, {
    configuration: record.configuration,
    product_type: '포스터 · 전단지',
    status: 'draft',
  })
})

test('publishing validates inactive variants', () => {
  const draft = toProductFormDraft(groupedProductRecord())

  draft.variants.전단지.optionValues.side[0] = ''
  draft.activeVariant = '포스터'

  assert.equal(
    getProductValidationMessage(draft, 'published'),
    '전단지: 모든 상품 옵션을 입력해주세요.',
  )
  assert.throws(() => toProductWriteInput(draft, 'published'), {
    message: '전단지: 모든 상품 옵션을 입력해주세요.',
  })
})

test('missing or unknown variant keys are rejected', () => {
  const missing = structuredClone(groupedProductRecord())
  delete missing.configuration.variants.전단지

  assert.throws(() => toProductFormDraft(missing), {
    message: '상품 설정의 세부 유형을 확인해주세요.',
  })

  const extra = structuredClone(groupedProductRecord())
  extra.configuration.variants.명함 = {}

  assert.throws(() => toProductFormDraft(extra), {
    message: '상품 설정의 세부 유형을 확인해주세요.',
  })
})

test('missing DB fields are rejected instead of using frontend defaults', () => {
  for (const field of [
    'optionValues',
    'priceRowsBySelection',
    'serviceEstimatesBySelection',
  ]) {
    const product = structuredClone(groupedProductRecord())

    delete product.configuration.variants.포스터[field]

    assert.throws(() => toProductFormDraft(product), {
      message: '상품 설정 형식을 확인해주세요.',
    })
  }
})

test('unsupported product types are rejected instead of loading defaults', () => {
  assert.throws(
    () =>
      toProductFormDraft(
        groupedProductRecord({ product_type: '알 수 없는 상품' }),
      ),
    { message: '지원하지 않는 상품 유형입니다.' },
  )
})

test('drafts store blank numbers as null in the grouped configuration', () => {
  const draft = createProductFormDraft('브로슈어 · 카탈로그')
  const brochure = draft.variants['브로슈어 · 카탈로그']

  brochure.priceRowsBySelection['0:0:0:0'] = [
    { quantity: '', unitPrice: '', printAmount: '' },
  ]

  const input = toProductWriteInput(draft, 'draft')
  const configuration = input.configuration
  const storedBrochure = configuration.variants['브로슈어 · 카탈로그']

  assert.equal(storedBrochure.priceRowsBySelection['0:0:0:0'][0].quantity, null)
  assert.equal(
    storedBrochure.priceRowsBySelection['0:0:0:0'][0].unitPrice,
    null,
  )
  assert.equal(
    storedBrochure.priceRowsBySelection['0:0:0:0'][0].printAmount,
    null,
  )
  brochure.optionValues.pageCount[0] = ''

  assert.equal(
    getProductValidationMessage(draft, 'published'),
    '브로슈어 · 카탈로그: 모든 상품 옵션을 입력해주세요.',
  )
})

test('blank frontend drafts cannot be published without DB-backed values', () => {
  const draft = createProductFormDraft('브로슈어 · 카탈로그')
  const brochure = draft.variants['브로슈어 · 카탈로그']

  for (const key of Object.keys(brochure.optionValues)) {
    brochure.optionValues[key] = ['입력값']
  }

  assert.equal(
    getProductValidationMessage(draft, 'published'),
    '브로슈어 · 카탈로그: 모든 수량, 인쇄 단가와 합계를 입력해주세요.',
  )
})

test('drafts allow blank added inputs while publishing targets the blank field', () => {
  const draft = toProductFormDraft(groupedProductRecord())
  const poster = draft.variants.포스터

  draft.activeVariant = '전단지'
  poster.priceRowsBySelection['0:0:0:0'][0].unitPrice = ''

  assert.equal(getProductValidationIssue(draft, 'draft'), null)
  assert.deepEqual(getProductValidationIssue(draft, 'published'), {
    focusTarget: { field: 'unitPrice', kind: 'price-row', rowIndex: 0 },
    message: '포스터: 모든 수량, 인쇄 단가와 합계를 입력해주세요.',
    selectedOptionIndexes: {
      coating: 0,
      paper: 0,
      size: 0,
      thickness: 0,
    },
    variant: '포스터',
  })
})

test('publishing requires price rows for every selectable price combination', () => {
  const draft = toProductFormDraft(groupedProductRecord())
  const poster = draft.variants.포스터

  poster.optionValues.size.push('A2(420x594mm)')

  assert.deepEqual(getProductValidationIssue(draft, 'published'), {
    focusTarget: { kind: 'price-add' },
    message: '포스터: 모든 수량, 인쇄 단가와 합계를 입력해주세요.',
    selectedOptionIndexes: {
      coating: 0,
      paper: 0,
      size: 1,
      thickness: 0,
    },
    variant: '포스터',
  })
})

test('publishing requires service estimates for every selectable service combination', () => {
  const draft = toProductFormDraft(groupedProductRecord())
  const flyer = draft.variants.전단지

  flyer.optionValues.side.push('양면')
  flyer.priceRowsBySelection['0:0:0:1'] = [
    { quantity: '100', unitPrice: '400', printAmount: '40,000' },
  ]

  assert.deepEqual(getProductValidationIssue(draft, 'published'), {
    focusTarget: { kind: 'service' },
    message: '전단지: 모든 서비스 견적을 입력해주세요.',
    selectedOptionIndexes: {
      paper: 0,
      side: 1,
      size: 0,
      thickness: 0,
    },
    variant: '전단지',
  })
})

test('legacy rows derive an editable print total until the product is saved', () => {
  const record = groupedProductRecord()
  delete record.configuration.variants.포스터.priceRowsBySelection[
    '0:0:0:0'
  ][0].printAmount

  const draft = toProductFormDraft(record)

  assert.deepEqual(draft.variants.포스터.priceRowsBySelection['0:0:0:0'], [
    { quantity: '100', unitPrice: '2,700.5', printAmount: '270,050' },
  ])
})
