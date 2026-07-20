import { AdminDataTableSection } from '../components/admin-table/AdminDataTableSection'
import type {
  AdminTableColumn,
  AdminTableFilter,
} from '../components/admin-table/AdminDataTableSection'
import {
  contentTypeFilterOptions,
  getUserTagOptions,
} from '../components/admin-table/adminTableFilters'
import { portfolioRows } from './portfolioData'
import type { PortfolioRow } from './portfolioData'
import './PortfolioPage.css'

const portfolioStatusContent = {
  draft: {
    className: 'admin-data-table__status admin-data-table__status--draft',
    label: '임시저장',
  },
  published: {
    className: 'admin-data-table__status',
    label: '게시됨',
  },
} as const

const portfolioFilters = [
  { id: 'type', label: '유형 필터', options: contentTypeFilterOptions },
  {
    id: 'status',
    label: '상태 필터',
    options: getUserTagOptions(portfolioRows.map((row) => row.type)),
  },
] satisfies readonly AdminTableFilter[]

function renderStatus(row: PortfolioRow) {
  const status = portfolioStatusContent[row.status]

  return (
    <span className={status.className}>
      <span className="admin-data-table__status-dot" />
      <span>{status.label}</span>
    </span>
  )
}

function renderLanding(row: PortfolioRow) {
  if (row.landingStatus === 'published') {
    return <span className="admin-data-table__brand-text">게시됨</span>
  }

  return <span>-</span>
}

const portfolioColumns = [
  {
    header: '상태',
    id: 'status',
    renderCell: renderStatus,
    track: '120fr',
  },
  {
    header: '유형',
    id: 'type',
    renderCell: (row) => row.type,
    track: '160fr',
  },
  {
    header: '포트폴리오 제목',
    id: 'title',
    renderCell: (row) => <span className="admin-data-table__title-cell">{row.title}</span>,
    track: '456fr',
  },
  {
    header: '고객사',
    id: 'client',
    renderCell: (row) => row.client,
    track: '160fr',
  },
  {
    header: '랜딩',
    id: 'landing',
    renderCell: renderLanding,
    track: '120fr',
  },
  {
    header: '조회수',
    id: 'views',
    renderCell: (row) => row.views,
    track: '120fr',
  },
  {
    header: '등록일자',
    id: 'createdAt',
    renderCell: (row) => row.createdAt,
    track: '120fr',
  },
  {
    header: '상세',
    id: 'detail',
    renderCell: (row) => (
      <a className="admin-data-table__link" href={row.detailHref}>
        상세
      </a>
    ),
    track: '120fr',
  },
] satisfies readonly AdminTableColumn<PortfolioRow>[]

export function PortfolioPage() {
  return (
    <main className="portfolio-page" aria-label="포트폴리오 관리">
      <AdminDataTableSection
        bottomAction={{ href: '/portfolio/new', label: '신규 포폴 등록' }}
        columns={portfolioColumns}
        filters={portfolioFilters}
        getRowKey={(row) => row.id}
        rows={portfolioRows}
        search={{ label: '검색', placeholder: '포트폴리오 제목으로 검색해주세요.' }}
        title="포트폴리오 등록 현황"
      />
    </main>
  )
}
