import { fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { SalesTrendSeries } from '../../pages/salesData'
import { SalesTrendChart } from './SalesTrendChart'

const originalTextLengthDescriptor = Object.getOwnPropertyDescriptor(
  SVGElement.prototype,
  'getComputedTextLength',
)

beforeEach(() => {
  Object.defineProperty(SVGElement.prototype, 'getComputedTextLength', {
    configurable: true,
    value: vi.fn(function (this: SVGElement) {
      return this.textContent?.includes('판매 금액') ? 180 : 80
    }),
  })
})

afterEach(() => {
  if (originalTextLengthDescriptor) {
    Object.defineProperty(
      SVGElement.prototype,
      'getComputedTextLength',
      originalTextLengthDescriptor,
    )
    return
  }

  Reflect.deleteProperty(SVGElement.prototype, 'getComputedTextLength')
})

it('shows a measured tooltip only while a chart point is hovered', () => {
  const series: readonly SalesTrendSeries[] = [
    {
      color: 'info',
      id: 'product:brochure',
      label: '브로슈어',
      points: [
        {
          axisLabel: '08.17',
          tooltipLabel: '8월 17일~8월 18일 판매 금액',
          value: 3_100_000,
        },
        {
          axisLabel: '08.19',
          tooltipLabel: '8월 19일~8월 20일 판매 금액',
          value: 4_250_000,
        },
      ],
      productId: 'brochure',
    },
  ]
  const view = render(
    <SalesTrendChart
      filters={{ channel: 'all', from: '2026-08-17', to: '2026-08-20' }}
      onFilterChange={vi.fn()}
      series={series}
    />,
  )
  const hitAreas = view.container.querySelectorAll<SVGCircleElement>(
    '.admin-sales-chart__point-hit-area',
  )

  expect(hitAreas).toHaveLength(2)
  expect(
    view.container.querySelector('.admin-sales-chart-tooltip'),
  ).toBeNull()

  fireEvent.pointerEnter(hitAreas[1])

  const tooltip = view.container.querySelector<SVGGElement>(
    '.admin-sales-chart-tooltip',
  )
  const background = tooltip?.querySelector('rect')

  expect(background?.getAttribute('width')).toBe('204')
  expect(tooltip?.getAttribute('transform')).toMatch(/^translate\(1092 /)

  fireEvent.pointerLeave(hitAreas[1])

  expect(
    view.container.querySelector('.admin-sales-chart-tooltip'),
  ).toBeNull()

  fireEvent.focus(hitAreas[0])
  expect(
    view.container.querySelector('.admin-sales-chart-tooltip'),
  ).not.toBeNull()

  fireEvent.blur(hitAreas[0])
  expect(
    view.container.querySelector('.admin-sales-chart-tooltip'),
  ).toBeNull()
})
