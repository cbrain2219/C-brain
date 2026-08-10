import type { ReactNode } from 'react'
import type { SalesEvent } from '@repo/supabase'
import { formatSalesNumber } from '../../pages/salesData'

type SalesTransactionsTableProps = {
  readonly onRefund: (event: SalesEvent) => void
  readonly rows: readonly SalesEvent[]
}

const headers = [
  '상태',
  '상품명',
  '거래일자',
  '거래금액',
  '고객',
  '환불가능액',
  '거래영수증',
  '환불',
] as const

function getStatusContent(event: SalesEvent) {
  if (event.kind === 'refund') {
    return {
      className: 'admin-sales-status--error',
      label: event.status === 'succeeded' ? '환불완료' : '환불실패',
    }
  }

  if (event.status === 'cancelled') {
    return {
      className: 'admin-sales-status--error',
      label: '전액환불',
    }
  }

  if (event.status === 'partial_cancelled') {
    return {
      className: 'admin-sales-status--muted',
      label: '부분환불',
    }
  }

  return {
    className: 'admin-sales-status--brand',
    label: '결제완료',
  }
}

export function SalesTransactionsTable({
  onRefund,
  rows,
}: SalesTransactionsTableProps) {
  return (
    <section
      className="admin-sales-transactions"
      aria-labelledby="sales-transactions-title"
    >
      <h2
        className="admin-sales-section-title pretendard-bold-18"
        id="sales-transactions-title"
      >
        상품별 거래 현황
      </h2>

      <div className="admin-sales-table-scroll">
        <div
          className="admin-sales-table"
          role="table"
          aria-label="상품별 거래 현황"
        >
          <div className="admin-sales-table__header" role="row">
            {headers.map((header) => (
              <div
                className="admin-sales-table__heading pretendard-bold-14"
                key={header}
                role="columnheader"
              >
                {header}
              </div>
            ))}
          </div>

          <div className="admin-sales-table__body" role="rowgroup">
            {rows.length > 0 ? (
              rows.map((row) => {
                const status = getStatusContent(row)
                const channel = row.channel === 'site' ? '사이트' : 'LinkPay'

                return (
                  <div
                    className="admin-sales-table__row"
                    key={row.id}
                    role="row"
                  >
                    <Cell>
                      <span
                        className={`admin-sales-status ${status.className} pretendard-bold-14`}
                      >
                        <span className="admin-sales-status__dot" />
                        {status.label}
                      </span>
                    </Cell>
                    <Cell strong>
                      [{channel}] {row.orderName}
                    </Cell>
                    <Cell>{formatOccurredAt(row.occurredAt)}</Cell>
                    <Cell>
                      {formatSalesNumber(
                        row.kind === 'refund' ? -row.amount : row.amount,
                      )}
                    </Cell>
                    <Cell>{row.customerLabel}</Cell>
                    <Cell>
                      {row.kind === 'payment' && row.refundableAmount !== null
                        ? formatSalesNumber(row.refundableAmount)
                        : '-'}
                    </Cell>
                    <Cell>
                      {row.receiptUrl ? (
                        <a
                          className="admin-sales-table__receipt"
                          href={row.receiptUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          보기
                        </a>
                      ) : (
                        '-'
                      )}
                    </Cell>
                    <Cell>
                      {canRefund(row) ? (
                        <button
                          className="admin-sales-table__refund pretendard-medium-14"
                          onClick={() => onRefund(row)}
                          type="button"
                        >
                          환불
                        </button>
                      ) : (
                        '-'
                      )}
                    </Cell>
                  </div>
                )
              })
            ) : (
              <div className="admin-sales-table__empty" role="row">
                <span
                  aria-colspan={headers.length}
                  className="admin-sales-table__empty-message pretendard-medium-14"
                  role="cell"
                >
                  조회할 데이터가 없습니다.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function Cell({
  children,
  strong = false,
}: {
  readonly children: ReactNode
  readonly strong?: boolean
}) {
  return (
    <div
      className={`admin-sales-table__cell ${strong ? 'admin-sales-table__product pretendard-bold-14' : 'pretendard-medium-14'}`}
      role="cell"
    >
      {children}
    </div>
  )
}

function canRefund(event: SalesEvent) {
  return (
    event.kind === 'payment' &&
    event.refundableAmount !== null &&
    event.refundableAmount > 0
  )
}

function formatOccurredAt(value: string | null) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '-'

  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      day: '2-digit',
      month: '2-digit',
      timeZone: 'Asia/Seoul',
      year: '2-digit',
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  )

  return `${parts.year}. ${parts.month}. ${parts.day}`
}
