import { renderAdminContentStatus, renderAdminPublicationState } from '../components/admin-table/AdminContentTableCells'
import type { AdminContentStatus, AdminPublicationState } from '../components/admin-table/AdminContentTableCells'
import { AdminDataTableSection } from '../components/admin-table/AdminDataTableSection'
import type { AdminTableColumn, AdminTableFilter } from '../components/admin-table/AdminDataTableSection'
import { contentTypeFilterOptions, getUserTagOptions } from '../components/admin-table/adminTableFilters'
import './PortfolioPage.css'

type ReviewRow = {
  readonly createdAt: string
  readonly detailHref: string
  readonly id: string
  readonly landingStatus: AdminPublicationState
  readonly status: AdminContentStatus
  readonly title: string
  readonly type: string
  readonly views: string
}

const reviewRows: readonly ReviewRow[] = []

const reviewFilters = [
  { id: 'type', label: '유형 필터', options: contentTypeFilterOptions },
  {
    id: 'status',
    label: '상태 필터',
    options: getUserTagOptions(reviewRows.map((row) => row.type)),
  },
] satisfies readonly AdminTableFilter[]

const reviewColumns = [
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
    header: '인터뷰 · 후기 제목',
    id: 'title',
    renderCell: (row) => <span className="admin-data-table__title-cell">{row.title}</span>,
    track: '600fr',
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
] satisfies readonly AdminTableColumn<ReviewRow>[]

export function ReviewPage() {
  return (
    <main className="portfolio-page" aria-label="고객 인터뷰 · 후기 관리">
      <AdminDataTableSection
        bottomAction={{
          href: '/reviews/new',
          label: '신규 인터뷰 · 후기 등록',
        }}
        columns={reviewColumns}
        filters={reviewFilters}
        getRowKey={(row) => row.id}
        rows={reviewRows}
        search={{
          label: '검색',
          placeholder: '인터뷰 · 후기 제목으로 검색해주세요.',
        }}
        title="고객 인터뷰 · 후기 현황"
      />
    </main>
  )
}
