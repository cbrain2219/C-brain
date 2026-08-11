import type {
  TableInsert,
  TableRow,
} from '@repo/supabase/types'
import { formatNumericValue } from './productData.ts'

export type LinkPayFormState = {
  amount: string
  category: string
  client: string
  pageQuantity: string
  paper: string
  paymentName: string
  service: string
}

export type LinkPayListRow = {
  amount: string
  client: string
  detailHref: string
  id: string
  paymentName: string
  publicToken: string
  status: LinkPayEffectiveState
}

export type LinkPayEffectiveState = 'active' | 'disabled'

export type PaymentLinkInput = Pick<
  TableInsert<'payment_links'>,
  | 'amount'
  | 'category'
  | 'client_name'
  | 'page_quantity'
  | 'paper'
  | 'payment_name'
  | 'service'
>

export type LinkPayFilters = {
  client: string
  query: string
  status: '전체' | '활성' | '중단'
}

export function createInitialLinkPayForm(): LinkPayFormState {
  return {
    amount: '',
    category: '',
    client: '',
    pageQuantity: '',
    paper: '',
    paymentName: '',
    service: '',
  }
}

export function toPaymentLinkInput(form: LinkPayFormState): PaymentLinkInput {
  const amountText = form.amount.replaceAll(',', '')
  const category = form.category.trim()
  const clientName = form.client.trim()
  const pageQuantity = form.pageQuantity.trim()
  const paper = form.paper.trim()
  const paymentName = form.paymentName.trim()
  const service = form.service.trim()

  if (
    [category, service, paper, pageQuantity, clientName, paymentName].some(
      (value) => !value,
    ) || !/^\d+$/.test(amountText)
  ) {
    throw new Error('링크페이 정보를 확인해주세요.')
  }

  const amount = Number(amountText)

  if (!Number.isSafeInteger(amount) || amount < 1 || amount > 999_999_999_999) {
    throw new Error('링크페이 정보를 확인해주세요.')
  }

  return {
    amount,
    category,
    client_name: clientName,
    page_quantity: pageQuantity,
    paper,
    payment_name: paymentName,
    service,
  }
}

export function toLinkPayFormState(
  paymentLink: TableRow<'payment_links'>,
): LinkPayFormState {
  return {
    amount: formatNumericValue(String(paymentLink.amount)),
    category: paymentLink.category,
    client: paymentLink.client_name,
    pageQuantity: paymentLink.page_quantity,
    paper: paymentLink.paper,
    paymentName: paymentLink.payment_name,
    service: paymentLink.service,
  }
}

export function toLinkPayListRow(
  paymentLink: TableRow<'payment_links'>,
): LinkPayListRow {
  return {
    amount: `${new Intl.NumberFormat('ko-KR').format(paymentLink.amount)}원`,
    client: paymentLink.client_name,
    detailHref: `/linkpay/${paymentLink.id}`,
    id: paymentLink.id,
    paymentName: paymentLink.payment_name,
    publicToken: paymentLink.public_token,
    status: paymentLink.disabled_at ? 'disabled' : 'active',
  }
}

export function filterLinkPayRows(
  rows: readonly LinkPayListRow[],
  filters: LinkPayFilters,
) {
  const query = filters.query.trim().toLocaleLowerCase('ko-KR')
  const status =
    filters.status === '활성'
      ? 'active'
      : filters.status === '중단'
        ? 'disabled'
        : '전체'

  return rows.filter(
    (row) =>
      (filters.client === '전체' || row.client === filters.client) &&
      (status === '전체' || row.status === status) &&
      row.paymentName.toLocaleLowerCase('ko-KR').includes(query),
  )
}

export function buildLinkPayUrl(publicToken: string, userAppUrl: string) {
  return new URL(`/linkpay/${encodeURIComponent(publicToken)}`, userAppUrl).toString()
}
