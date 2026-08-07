import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  filterProductRows,
  formatNumericValue,
  toProductListRow,
} from '../src/pages/productData.ts'

const productPageSource = await readFile(
  new URL('../src/pages/ProductPage.tsx', import.meta.url),
  'utf8',
)

test('numeric form values keep digits and Korean thousands separators', () => {
  assert.equal(formatNumericValue('0012,345원'), '12,345')
  assert.equal(formatNumericValue(''), '')
})

test('list filtering matches selected status, type, and name query', () => {
  const rows = [
    {
      id: 'a',
      name: '브로슈어 · 카탈로그',
      status: 'published',
      type: '브로슈어 · 카탈로그',
    },
    { id: 'b', name: '명함', status: 'draft', type: '명함 · 봉투' },
  ]

  assert.deepEqual(
    filterProductRows(rows, {
      query: '브로',
      status: '전체',
      type: '전체',
    }),
    [rows[0]],
  )
  assert.deepEqual(
    filterProductRows(rows, { query: '', status: 'draft', type: '전체' }),
    [rows[1]],
  )
})

test('grouped product list uses its category name and lowest variant price', () => {
  const row = toProductListRow({
    configuration: {
      variants: {
        포스터: {
          optionValues: {},
          priceRowsBySelection: {
            poster: [{ quantity: 100, unitPrice: 520000 }],
          },
          serviceEstimatesBySelection: {},
        },
        전단지: {
          optionValues: {},
          priceRowsBySelection: {
            flyer: [{ quantity: 100, unitPrice: 130000 }],
          },
          serviceEstimatesBySelection: {},
        },
      },
    },
    created_at: '2026-07-21T00:00:00.000Z',
    id: 'poster-flyer',
    product_type: '포스터 · 전단지',
    sort_order: 0,
    status: 'published',
  })

  assert.equal(row.name, '포스터 · 전단지')
  assert.equal(row.type, '포스터 · 전단지')
  assert.equal(row.price, '130,000원~')
  assert.equal(row.detailHref, '/products/poster-flyer')
  assert.equal(row.createdAt, '26. 07. 21')
})

test('product dates use KST and service-only products expose their estimate', () => {
  const row = toProductListRow({
    configuration: {
      variants: {
        로고: {
          optionValues: {},
          priceRowsBySelection: {},
          serviceEstimatesBySelection: {
            '': { designPrintEstimate: 50000, planningEstimate: null },
          },
        },
      },
    },
    created_at: '2026-07-20T16:00:00.000Z',
    id: 'kst-product',
    product_type: '로고',
    sort_order: 0,
    status: 'draft',
  })

  assert.equal(row.name, '로고')
  assert.equal(row.price, '50,000원~')
  assert.equal(row.createdAt, '26. 07. 21')
})

test('product list shows the category once while keeping its filter', () => {
  assert.doesNotMatch(productPageSource, /header: '유형'/)
  assert.match(productPageSource, /header: '상품명'/)
  assert.match(productPageSource, /label: '유형 필터'/)
})
