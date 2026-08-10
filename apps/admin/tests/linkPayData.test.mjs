import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildLinkPayUrl,
  createInitialLinkPayForm,
  filterLinkPayRows,
  toLinkPayFormState,
  toLinkPayListRow,
  toPaymentLinkInput,
} from '../src/pages/linkPayData.ts'

const paymentLink = {
  amount: 120000,
  category: '브로슈어',
  client_name: '테스트 고객사',
  created_at: '2026-07-21T16:00:00.000Z',
  id: 'payment-link-id',
  page_quantity: '12p / 500부',
  paper: '일반지',
  payment_name: '브로슈어 제작비',
  public_token: '11111111-1111-4111-8111-111111111111',
  service: '디자인',
  disabled_at: null,
  updated_at: '2026-07-21T16:00:00.000Z',
}

const validForm = {
  amount: '120,000',
  category: '브로슈어',
  client: '테스트 고객사',
  pageQuantity: '12p / 500부',
  paper: '일반지',
  paymentName: '브로슈어 제작비',
  service: '디자인',
}

test('payment link input trims text and stores integer won', () => {
  assert.deepEqual(
    toPaymentLinkInput({
      ...validForm,
      category: ' 브로슈어 ',
      client: ' 테스트 고객사 ',
      pageQuantity: ' 12p / 500부 ',
      paper: ' 일반지 ',
      paymentName: ' 브로슈어 제작비 ',
      service: ' 디자인 ',
    }),
    {
      amount: 120000,
      category: '브로슈어',
      client_name: '테스트 고객사',
      page_quantity: '12p / 500부',
      paper: '일반지',
      payment_name: '브로슈어 제작비',
      service: '디자인',
    },
  )
})

test('payment link input rejects empty text and invalid amount', () => {
  for (const form of [
    { ...validForm, amount: '0' },
    { ...validForm, amount: '1,000,000,000,000' },
    ...['category', 'service', 'paper', 'pageQuantity', 'client', 'paymentName'].map(
      (field) => ({ ...validForm, [field]: ' ' }),
    ),
  ]) {
    assert.throws(() => toPaymentLinkInput(form), {
      message: '링크페이 정보를 확인해주세요.',
    })
  }
})

test('payment link input rejects malformed numeric text', () => {
  for (const amount of ['-1', '1.5', '1e3']) {
    assert.throws(
      () =>
        toPaymentLinkInput({
          ...validForm,
          amount,
        }),
      { message: '링크페이 정보를 확인해주세요.' },
    )
  }
})

test('database rows map to editable form and formatted list values', () => {
  assert.deepEqual(toLinkPayFormState(paymentLink), {
    amount: '120,000',
    category: '브로슈어',
    client: '테스트 고객사',
    pageQuantity: '12p / 500부',
    paper: '일반지',
    paymentName: '브로슈어 제작비',
    service: '디자인',
  })

  assert.deepEqual(toLinkPayListRow(paymentLink), {
    amount: '120,000원',
    client: '테스트 고객사',
    detailHref: '/linkpay/payment-link-id',
    id: 'payment-link-id',
    paymentName: '브로슈어 제작비',
    publicToken: '11111111-1111-4111-8111-111111111111',
    status: 'active',
  })

  assert.equal(
    toLinkPayListRow({
      ...paymentLink,
      disabled_at: '2026-08-09T00:00:00.000Z',
    }).status,
    'disabled',
  )
})

test('list filtering combines client, effective state, and name query', () => {
  const rows = [
    toLinkPayListRow(paymentLink),
    {
      ...toLinkPayListRow(paymentLink),
      client: '완료 고객사',
      id: 'disabled-id',
      paymentName: '명함 제작비',
      status: 'disabled',
    },
  ]

  assert.deepEqual(
    filterLinkPayRows(rows, {
      client: '테스트 고객사',
      query: '브로',
      status: '활성',
    }),
    [rows[0]],
  )
  assert.deepEqual(
    filterLinkPayRows(rows, {
      client: '전체',
      query: '',
      status: '중단',
    }),
    [rows[1]],
  )
})

test('public URL uses the configured user app origin and UUID token', () => {
  assert.equal(
    buildLinkPayUrl(
      paymentLink.public_token,
      'https://www.cbrain.co.kr/admin-path',
    ),
    'https://www.cbrain.co.kr/linkpay/11111111-1111-4111-8111-111111111111',
  )
})

test('initial form is empty', () => {
  assert.deepEqual(createInitialLinkPayForm(), {
    amount: '',
    category: '',
    client: '',
    pageQuantity: '',
    paper: '',
    paymentName: '',
    service: '',
  })
})
