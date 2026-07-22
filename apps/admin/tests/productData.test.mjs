import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createInitialProductForm,
  filterProductRows,
  getMissingUnitPriceKey,
  getUnitPriceKey,
  toProductMutationInput,
  toProductListRow,
} from '../src/pages/productData.ts'

function completeForm() {
  return {
    ...createInitialProductForm(),
    designPrintEstimate: '15,000',
    name: '브로슈어',
    orderQuantities: ['100', '200'],
    pageCounts: ['8'],
    paperTypes: ['랑데뷰'],
    planningEstimate: '10,000',
    productType: '일반상품',
    unitPrices: { '0:0:0': '1,200', '0:0:1': '1,000' },
  }
}

test('published product requires every price matrix cell', () => {
  const form = completeForm()
  delete form.unitPrices['0:0:1']

  assert.equal(getMissingUnitPriceKey(form), '0:0:1')
})

test('draft and published input use numeric storage values', () => {
  const form = completeForm()

  assert.deepEqual(toProductMutationInput(form, 'draft'), {
    design_print_estimate: 15000,
    name: '브로슈어',
    order_quantities: [100, 200],
    page_counts: [8],
    paper_types: ['랑데뷰'],
    planning_estimate: 10000,
    status: 'draft',
    type: '일반상품',
    unit_prices: { '0:0:0': 1200, '0:0:1': 1000 },
  })
  assert.equal(toProductMutationInput(form, 'published').status, 'published')
})

test('product requires at least one paper type', () => {
  const form = { ...completeForm(), paperTypes: [] }

  assert.throws(() => toProductMutationInput(form, 'draft'), {
    message: '상품 정보를 확인해주세요.',
  })
})

test('product requires at least one page count and order quantity', () => {
  for (const form of [
    { ...completeForm(), pageCounts: [] },
    { ...completeForm(), orderQuantities: [] },
  ]) {
    assert.throws(() => toProductMutationInput(form, 'draft'), {
      message: '상품 정보를 확인해주세요.',
    })
  }
})

test('list filtering matches selected status, type, and name query', () => {
  const rows = [
    { id: 'a', name: '브로슈어', status: 'published', type: '일반상품' },
    { id: 'b', name: '명함', status: 'draft', type: '명함' },
  ]

  assert.deepEqual(
    filterProductRows(rows, { query: '브로', status: '전체', type: '전체' }),
    [rows[0]],
  )
  assert.deepEqual(
    filterProductRows(rows, { query: '', status: 'draft', type: '전체' }),
    [rows[1]],
  )
})

test('lowest unit price is rendered as product price', () => {
  const row = toProductListRow({
    created_at: '2026-07-21T00:00:00.000Z',
    design_print_estimate: 15000,
    id: 'a',
    name: '브로슈어',
    order_quantities: [100],
    page_counts: [8],
    paper_types: ['랑데뷰'],
    planning_estimate: 10000,
    sort_order: 0,
    status: 'published',
    type: '일반상품',
    unit_prices: { '0:0:0': 1200, '0:0:1': 1000 },
    updated_at: '2026-07-21T00:00:00.000Z',
  })

  assert.equal(getUnitPriceKey(0, 0, 1), '0:0:1')
  assert.equal(row.price, '1,000원')
  assert.equal(row.createdAt, '26. 07. 21')
})

test('product dates are displayed in the administrator KST calendar day', () => {
  const row = toProductListRow({
    created_at: '2026-07-20T16:00:00.000Z',
    design_print_estimate: 0,
    id: 'kst-product',
    name: '상품',
    order_quantities: [100],
    page_counts: [8],
    paper_types: ['랑데뷰'],
    planning_estimate: 0,
    sort_order: 0,
    status: 'draft',
    type: '브로슈어',
    unit_prices: {},
    updated_at: '2026-07-20T16:00:00.000Z',
  })

  assert.equal(row.createdAt, '26. 07. 21')
})
