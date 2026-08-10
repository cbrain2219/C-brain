import type { SalesSummary } from '@repo/supabase'
import { AdminIcon } from '../AdminIcon'
import { formatSalesDateLabel, formatSalesNumber } from '../../pages/salesData'
import type { SalesFilters } from '../../pages/salesData'

type SalesSummaryCardsProps = {
  readonly filters: SalesFilters
  readonly onFilterChange: (filters: SalesFilters) => void
  readonly summary: SalesSummary
}

const secondaryCards = [
  {
    field: 'grossSalesAmount',
    icon: 'card-check',
    label: '총 승인액',
    unit: '원',
  },
  {
    field: 'paymentCount',
    icon: 'pen-tool',
    label: '결제 건 수',
    unit: '건',
  },
  {
    field: 'refundedAmount',
    icon: 'user-profile',
    label: '환불 금액',
    unit: '원',
  },
] as const

function getChannelLabel(channel: SalesFilters['channel']) {
  if (channel === 'site') return '사이트 채널'
  if (channel === 'linkpay') return 'LinkPay 채널'
  return '전체 채널'
}

export function SalesSummaryCards({
  filters,
  onFilterChange,
  summary,
}: SalesSummaryCardsProps) {
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
          <DateFilter
            label="매출 조회 시작일"
            max={filters.to}
            onChange={(from) => onFilterChange({ ...filters, from })}
            value={filters.from}
          />
          <span aria-hidden="true">~</span>
          <DateFilter
            label="매출 조회 종료일"
            min={filters.from}
            onChange={(to) => onFilterChange({ ...filters, to })}
            value={filters.to}
          />
        </div>
      </div>

      <div className="admin-sales-summary__cards">
        <article className="admin-sales-summary-card admin-sales-summary-card--primary">
          <span className="admin-sales-summary-card__settlement pretendard-bold-12">
            {getChannelLabel(filters.channel)}
          </span>
          <div className="admin-sales-summary-card__value-group">
            <span className="pretendard-medium-16">조회 기간 순매출</span>
            <strong className="admin-sales-summary-card__value pretendard-bold-32">
              {formatSalesNumber(summary.netSalesAmount)}
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

type DateFilterProps = {
  readonly label: string
  readonly max?: string
  readonly min?: string
  readonly onChange: (value: string) => void
  readonly value: string
}

function DateFilter({ label, max, min, onChange, value }: DateFilterProps) {
  return (
    <label className="admin-sales-period__date">
      <span className="admin-sales-period__calendar">
        <AdminIcon name="calendar" />
      </span>
      <time dateTime={value}>{formatSalesDateLabel(value)}</time>
      <input
        aria-label={label}
        className="admin-sales-period__input"
        max={max}
        min={min}
        onChange={(event) => onChange(event.currentTarget.value)}
        required
        type="date"
        value={value}
      />
    </label>
  )
}
