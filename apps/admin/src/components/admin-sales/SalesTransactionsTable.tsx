import { formatSalesNumber } from '../../pages/salesData'
import type { SalesTransaction } from '../../pages/salesData'

type SalesTransactionsTableProps = {
  readonly onRefund: (transaction: SalesTransaction) => void
  readonly rows: readonly SalesTransaction[]
}

const statusContent = {
  'refund-complete': {
    className: 'admin-sales-status--error',
    label: '환불완료',
  },
  scheduled: {
    className: 'admin-sales-status--muted',
    label: '정산예정',
  },
  settled: {
    className: 'admin-sales-status--brand',
    label: '정산완료',
  },
} as const

const headers = [
  '상태',
  '상품명',
  '거래일자',
  '거래금액',
  '카드수수료',
  '정산금',
  '거래영수증',
  '환불',
] as const

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
                const status = statusContent[row.status]

                return (
                  <div
                    className="admin-sales-table__row"
                    key={row.id}
                    role="row"
                  >
                    <div className="admin-sales-table__cell" role="cell">
                      <span
                        className={`admin-sales-status ${status.className} pretendard-bold-14`}
                      >
                        <span className="admin-sales-status__dot" />
                        {status.label}
                      </span>
                    </div>
                    <div
                      className="admin-sales-table__cell admin-sales-table__product pretendard-bold-14"
                      role="cell"
                    >
                      {row.productName}
                    </div>
                    <div
                      className="admin-sales-table__cell pretendard-medium-14"
                      role="cell"
                    >
                      {row.transactionDate}
                    </div>
                    <div
                      className="admin-sales-table__cell pretendard-medium-14"
                      role="cell"
                    >
                      {formatSalesNumber(row.transactionAmount)}
                    </div>
                    <div
                      className="admin-sales-table__cell pretendard-medium-14"
                      role="cell"
                    >
                      {formatSalesNumber(row.cardFee)}
                    </div>
                    <div
                      className="admin-sales-table__cell pretendard-medium-14"
                      role="cell"
                    >
                      {formatSalesNumber(row.settlementAmount)}
                    </div>
                    <div
                      className="admin-sales-table__cell pretendard-medium-14"
                      role="cell"
                    >
                      {row.receiptHref ? (
                        <a
                          className="admin-sales-table__receipt"
                          href={row.receiptHref}
                        >
                          보기
                        </a>
                      ) : (
                        '-'
                      )}
                    </div>
                    <div
                      className="admin-sales-table__cell pretendard-medium-14"
                      role="cell"
                    >
                      {row.refundable ? (
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
                    </div>
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
