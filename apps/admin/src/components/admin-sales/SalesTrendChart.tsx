import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { AdminIcon } from '../AdminIcon'
import { formatSalesNumber, getChartPoints } from '../../pages/salesData'
import type {
  ChartPoint,
  SalesTrendPoint,
  SalesTrendSeries,
} from '../../pages/salesData'

const CHART_WIDTH = 1296
const CHART_HEIGHT = 436
const PLOT_TOP = 40
const PLOT_HEIGHT = 360
const DEFAULT_POINT_INDEX = 8
const GRID_LINE_COUNT = 19

type SalesTrendChartProps = {
  readonly series: readonly SalesTrendSeries[]
}

type RenderedPoint = {
  readonly chartPoint: ChartPoint
  readonly point: SalesTrendPoint
  readonly pointIndex: number
  readonly series: SalesTrendSeries
}

function getPointKey(seriesId: SalesTrendSeries['id'], pointIndex: number) {
  return `${seriesId}:${pointIndex}`
}

function getPolylinePoints(points: readonly ChartPoint[]) {
  return points.map((point) => `${point.x},${point.y + PLOT_TOP}`).join(' ')
}

function getAreaPath(points: readonly ChartPoint[]) {
  if (points.length === 0) return ''

  const baseline = PLOT_TOP + PLOT_HEIGHT
  const line = points
    .map((point) => `L ${point.x} ${point.y + PLOT_TOP}`)
    .join(' ')

  return `M ${points[0].x} ${baseline} ${line} L ${points.at(-1)?.x ?? 0} ${baseline} Z`
}

function getDefaultPointKey(visibleSeries: readonly SalesTrendSeries[]) {
  const preferredSeries = visibleSeries.find(
    (item) =>
      item.id === 'brochure-catalog' &&
      item.points.length > DEFAULT_POINT_INDEX,
  )
  const fallbackSeries = visibleSeries.find(
    (item) => item.points.length > DEFAULT_POINT_INDEX,
  )
  const target = preferredSeries ?? fallbackSeries

  return target ? getPointKey(target.id, DEFAULT_POINT_INDEX) : null
}

export function SalesTrendChart({ series }: SalesTrendChartProps) {
  const [selectedProductIds, setSelectedProductIds] = useState<
    readonly SalesTrendSeries['id'][]
  >(['brochure-catalog'])
  const [activePointKey, setActivePointKey] = useState<string | null>(
    'brochure-catalog:8',
  )

  const productSeries = series.filter((item) => item.id !== 'all')
  const visibleSeries = series.filter(
    (item) => item.id === 'all' || selectedProductIds.includes(item.id),
  )
  const hasData = visibleSeries.some((item) => item.points.length > 0)
  const commonMaximum = Math.max(
    ...visibleSeries.flatMap((item) => item.points.map((point) => point.value)),
    1,
  )

  const renderedSeries = visibleSeries.map((item) => ({
    chartPoints: getChartPoints(
      item.points.map((point) => point.value),
      CHART_WIDTH,
      PLOT_HEIGHT,
      commonMaximum,
    ),
    series: item,
  }))

  const renderedPoints = renderedSeries.flatMap(
    ({ chartPoints, series: renderedItem }) =>
      chartPoints.map((chartPoint, pointIndex) => ({
        chartPoint,
        point: renderedItem.points[pointIndex],
        pointIndex,
        series: renderedItem,
      })),
  )
  const defaultPointKey = getDefaultPointKey(visibleSeries)
  const activePoint = renderedPoints.find(
    (item) => getPointKey(item.series.id, item.pointIndex) === activePointKey,
  )
  const fallbackPoint = renderedPoints.find(
    (item) => getPointKey(item.series.id, item.pointIndex) === defaultPointKey,
  )
  const tooltipPoint = activePoint ?? fallbackPoint

  function addProduct(event: ChangeEvent<HTMLSelectElement>) {
    const productId = event.target.value as SalesTrendSeries['id']

    if (productId && !selectedProductIds.includes(productId)) {
      setSelectedProductIds((current) => [...current, productId])
      setActivePointKey(getPointKey(productId, DEFAULT_POINT_INDEX))
    }

    event.target.value = ''
  }

  function removeProduct(productId: SalesTrendSeries['id']) {
    setSelectedProductIds((current) => current.filter((id) => id !== productId))
    setActivePointKey(null)
  }

  return (
    <section
      className="admin-sales-chart-section"
      aria-labelledby="sales-chart-title"
    >
      <h2
        className="admin-sales-section-title pretendard-bold-18"
        id="sales-chart-title"
      >
        거래 금액 추이
      </h2>

      <div
        className={[
          'admin-sales-chart-card',
          hasData ? '' : 'admin-sales-chart-card--empty',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="admin-sales-chart-toolbar">
          <div className="admin-sales-chart-legend" aria-label="표시 중인 상품">
            <span className="admin-sales-chart-chip admin-sales-chart-chip--brand pretendard-medium-14">
              <span className="admin-sales-chart-chip__dot" />
              전체
            </span>
            {productSeries
              .filter((item) => selectedProductIds.includes(item.id))
              .map((item) => (
                <span
                  className="admin-sales-chart-chip admin-sales-chart-chip--info pretendard-medium-14"
                  key={item.id}
                >
                  <span className="admin-sales-chart-chip__dot" />
                  {item.label}
                  <button
                    aria-label={`${item.label} 차트에서 제거`}
                    className="admin-sales-chart-chip__remove"
                    onClick={() => removeProduct(item.id)}
                    type="button"
                  >
                    <AdminIcon name="x-close" size={16} />
                  </button>
                </span>
              ))}
          </div>

          <label className="admin-sales-chart-select">
            <span className="admin-sr-only">차트에 표시할 상품</span>
            <select
              className="admin-sales-chart-select__control pretendard-medium-14"
              defaultValue=""
              onChange={addProduct}
            >
              <option value="">상품을 선택해주세요.</option>
              {productSeries.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <span className="admin-sales-chart-select__icon">
              <AdminIcon name="chevron-down" />
            </span>
          </label>
        </div>

        <figure
          className="admin-sales-chart"
          onPointerLeave={() => setActivePointKey(defaultPointKey)}
        >
          <svg
            aria-label={
              hasData
                ? '1월부터 12월까지 전체 및 선택 상품 거래 금액 추이'
                : '1월부터 12월까지 조회된 거래 금액 데이터 없음'
            }
            className="admin-sales-chart__svg"
            role="img"
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          >
            <defs>
              <linearGradient
                id="admin-sales-area-gradient"
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop
                  offset="0"
                  stopColor="var(--admin-brand-500)"
                  stopOpacity="0.45"
                />
                <stop
                  offset="1"
                  stopColor="var(--admin-brand-500)"
                  stopOpacity="0.04"
                />
              </linearGradient>
            </defs>

            {Array.from({ length: GRID_LINE_COUNT }, (_, index) => (
              <line
                className="admin-sales-chart__grid-line"
                key={index}
                x1="0"
                x2={CHART_WIDTH}
                y1={PLOT_TOP + index * 20}
                y2={PLOT_TOP + index * 20}
              />
            ))}
            <line
              className="admin-sales-chart__axis"
              x1="0"
              x2="0"
              y1={PLOT_TOP}
              y2={PLOT_TOP + PLOT_HEIGHT}
            />

            {hasData
              ? renderedSeries.map(({ chartPoints, series: renderedItem }) => (
                  <g key={renderedItem.id}>
                    {renderedItem.id === 'all' ? (
                      <path
                        className="admin-sales-chart__area"
                        d={getAreaPath(chartPoints)}
                      />
                    ) : null}
                    <polyline
                      className={`admin-sales-chart__line admin-sales-chart__line--${renderedItem.color}`}
                      points={getPolylinePoints(chartPoints)}
                    />
                    {chartPoints.map((chartPoint, pointIndex) => {
                      const point = renderedItem.points[pointIndex]
                      const pointKey = getPointKey(renderedItem.id, pointIndex)

                      return (
                        <circle
                          aria-label={`${renderedItem.label}, ${point.tooltipLabel}, ${formatSalesNumber(point.value)}원`}
                          className={`admin-sales-chart__point admin-sales-chart__point--${renderedItem.color}`}
                          cx={chartPoint.x}
                          cy={chartPoint.y + PLOT_TOP}
                          key={pointKey}
                          onFocus={() => setActivePointKey(pointKey)}
                          onPointerEnter={() => setActivePointKey(pointKey)}
                          r="4"
                          tabIndex={0}
                        />
                      )
                    })}
                  </g>
                ))
              : null}

            {Array.from({ length: 12 }, (_, index) => (
              <text
                className="admin-sales-chart__axis-label pretendard-medium-12"
                key={index}
                textAnchor="middle"
                x={(CHART_WIDTH * index) / 11}
                y="430"
              >
                {index + 1}
              </text>
            ))}

            {hasData && tooltipPoint ? (
              <ChartTooltip point={tooltipPoint} />
            ) : null}
          </svg>

          <figcaption
            className={
              hasData
                ? 'admin-sr-only'
                : 'admin-sales-empty-message pretendard-medium-14'
            }
          >
            {hasData
              ? visibleSeries
                  .map(
                    (item) =>
                      `${item.label}: ${item.points
                        .map(
                          (point) =>
                            `${point.axisLabel}, ${formatSalesNumber(point.value)}원`,
                        )
                        .join(', ')}`,
                  )
                  .join('. ')
              : '조회할 데이터가 없습니다.'}
          </figcaption>
        </figure>
      </div>
    </section>
  )
}

function ChartTooltip({ point }: { readonly point: RenderedPoint }) {
  const width = 124
  const height = 54
  const x = Math.min(Math.max(point.chartPoint.x + 10, 0), CHART_WIDTH - width)
  const y = Math.max(point.chartPoint.y + PLOT_TOP - height - 12, 0)

  return (
    <g className="admin-sales-chart-tooltip" transform={`translate(${x} ${y})`}>
      <rect height={height} rx="12" width={width} />
      <text className="admin-sales-chart-tooltip__label" x="12" y="20">
        {point.point.tooltipLabel}
      </text>
      <text className="admin-sales-chart-tooltip__value" x="12" y="40">
        {formatSalesNumber(point.point.value)}원
      </text>
    </g>
  )
}
