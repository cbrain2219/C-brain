import { renderAdminContentStatus, renderAdminPublicationState } from '../components/admin-table/AdminContentTableCells'
import type { AdminContentStatus, AdminPublicationState } from '../components/admin-table/AdminContentTableCells'
import { AdminDataTableSection } from '../components/admin-table/AdminDataTableSection'
import type { AdminTableColumn, AdminTableFilter } from '../components/admin-table/AdminDataTableSection'
import { contentTypeFilterOptions, getUserTagOptions } from '../components/admin-table/adminTableFilters'
import './PortfolioPage.css'

type BlogBannerState = AdminPublicationState | 'zero'

type BlogRow = {
  readonly bannerStatus: BlogBannerState
  readonly createdAt: string
  readonly detailHref: string
  readonly id: string
  readonly landingStatus: AdminPublicationState
  readonly popularStatus: AdminPublicationState
  readonly status: AdminContentStatus
  readonly title: string
  readonly type: string
  readonly views: string
}

const blogRows: readonly BlogRow[] = []

const blogFilters = [
  { id: 'type', label: '유형 필터', options: contentTypeFilterOptions },
  {
    id: 'status',
    label: '상태 필터',
    options: getUserTagOptions(blogRows.map((row) => row.type)),
  },
] satisfies readonly AdminTableFilter[]

function renderBannerStatus(status: BlogBannerState) {
  if (status === 'zero') {
    return <span>0</span>
  }

  return renderAdminPublicationState(status)
}

const blogColumns = [
  {
    header: '상태',
    id: 'status',
    renderCell: (row) => renderAdminContentStatus(row.status),
    track: '120fr',
  },
  {
    header: '유형',
    id: 'type',
    renderCell: (row) => row.type,
    track: '160fr',
  },
  {
    header: '블로그 제목',
    id: 'title',
    renderCell: (row) => <span className="admin-data-table__title-cell">{row.title}</span>,
    track: '360fr',
  },
  {
    header: '조회수',
    id: 'views',
    renderCell: (row) => row.views,
    track: '120fr',
  },
  {
    header: '랜딩',
    id: 'landing',
    renderCell: (row) => renderAdminPublicationState(row.landingStatus),
    track: '120fr',
  },
  {
    header: '배너',
    id: 'banner',
    renderCell: (row) => renderBannerStatus(row.bannerStatus),
    track: '120fr',
  },
  {
    header: '인기',
    id: 'popular',
    renderCell: (row) => renderAdminPublicationState(row.popularStatus),
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
] satisfies readonly AdminTableColumn<BlogRow>[]

export function BlogPage() {
  return (
    <main className="portfolio-page" aria-label="블로그 관리">
      <AdminDataTableSection
        bottomAction={{ href: '/blog/new', label: '신규 블로그 등록' }}
        columns={blogColumns}
        filters={blogFilters}
        getRowKey={(row) => row.id}
        rows={blogRows}
        search={{ label: '검색', placeholder: '블로그 제목으로 검색해주세요.' }}
        title="블로그 등록 현황"
      />
    </main>
  )
}
