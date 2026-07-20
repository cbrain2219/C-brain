export type PortfolioStatus = 'draft' | 'published'
export type PortfolioLandingStatus = 'none' | 'published'

export type PortfolioRow = {
  readonly client: string
  readonly createdAt: string
  readonly detailHref: string
  readonly id: string
  readonly isPinned: boolean
  readonly landingStatus: PortfolioLandingStatus
  readonly status: PortfolioStatus
  readonly title: string
  readonly type: string
  readonly views: string
}

export const portfolioRows: readonly PortfolioRow[] = []

export function getPortfolioSettingCounts(rows: readonly PortfolioRow[]) {
  return {
    landing: rows.filter((row) => row.landingStatus === 'published').length,
    pinned: rows.filter((row) => row.isPinned).length,
  }
}
