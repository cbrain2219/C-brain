import { AdminIcon } from '../AdminIcon'
import { formatSalesNumber } from '../../pages/salesData'
import type { SalesSummary } from '../../pages/salesData'

type SalesSummaryCardsProps = {
  readonly summary: SalesSummary
}

const secondaryCards = [
  {
    field: 'monthlyPaymentAmount',
    icon: 'card-check',
    label: '이번 달 결제 금액',
    unit: '원',
  },
  {
    field: 'monthlyPaymentCount',
    icon: 'pen-tool',
    label: '이번 달 결제 건 수',
    unit: '건',
  },
  {
    field: 'monthlyVisitorCount',
    icon: 'user-profile',
    label: '이번 달 방문자 수',
    unit: '명',
  },
] as const

export function SalesSummaryCards({ summary }: SalesSummaryCardsProps) {
  return (
    <section
      className="admin-sales-summary"
      aria-labelledby="sales-summary-title"
    >
      <div className="admin-sales-section-heading">
        <h1
          className="admin-sales-section-title pretendard-bold-18"
          id="sales-summary-title"
        >
          매출 추이
        </h1>

        <div
          className="admin-sales-period pretendard-medium-14"
          aria-label="조회 기간"
        >
          <strong className="pretendard-bold-14">기간 설정</strong>
          <span className="admin-sales-period__date">
            <span className="admin-sales-period__calendar">
              <AdminIcon name="calendar" />
            </span>
            <time dateTime="2026-02-10">26. 02. 10</time>
          </span>
          <span aria-hidden="true">~</span>
          <span className="admin-sales-period__date">
            <span className="admin-sales-period__calendar">
              <AdminIcon name="calendar" />
            </span>
            <time dateTime="2026-03-09">26. 03. 09</time>
          </span>
        </div>
      </div>

      <div className="admin-sales-summary__cards">
        <article className="admin-sales-summary-card admin-sales-summary-card--primary">
          <span className="admin-sales-summary-card__settlement pretendard-bold-12">
            {summary.settlementLabel}
          </span>
          <div className="admin-sales-summary-card__value-group">
            <span className="pretendard-medium-16">예정 정산 금액</span>
            <strong className="admin-sales-summary-card__value pretendard-bold-32">
              {formatSalesNumber(summary.scheduledSettlementAmount)}
              <small className="pretendard-medium-16">원</small>
            </strong>
          </div>
        </article>

        {secondaryCards.map((card) => (
          <article className="admin-sales-summary-card" key={card.field}>
            <div className="admin-sales-summary-card__label-group">
              <span className="admin-sales-summary-card__icon">
                <AdminIcon name={card.icon} />
              </span>
              <span className="pretendard-medium-16">{card.label}</span>
            </div>
            <strong className="admin-sales-summary-card__value pretendard-bold-32">
              {formatSalesNumber(summary[card.field])}
              <small className="pretendard-medium-16">{card.unit}</small>
            </strong>
          </article>
        ))}
      </div>
    </section>
  )
}
