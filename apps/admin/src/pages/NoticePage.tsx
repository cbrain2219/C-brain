import { renderAdminContentStatus, renderAdminPinnedState } from '../components/admin-table/AdminContentTableCells'
import type { AdminContentStatus, AdminPinnedState } from '../components/admin-table/AdminContentTableCells'
import { AdminDataTableSection } from '../components/admin-table/AdminDataTableSection'
import type { AdminTableColumn, AdminTableFilter } from '../components/admin-table/AdminDataTableSection'
import { contentTypeFilterOptions, getUserTagOptions } from '../components/admin-table/adminTableFilters'
import './PortfolioPage.css'

type NoticeRow = {
  readonly createdAt: string
  readonly detailHref: string
  readonly id: string
  readonly pinnedStatus: AdminPinnedState
  readonly status: AdminContentStatus
  readonly title: string
  readonly type: string
}

const noticeRows: readonly NoticeRow[] = []

const noticeFilters = [
  { id: 'type', label: '유형 필터', options: contentTypeFilterOptions },
  {
    id: 'status',
    label: '상태 필터',
    options: getUserTagOptions(noticeRows.map((row) => row.type)),
  },
] satisfies readonly AdminTableFilter[]

const noticeColumns = [
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
    header: '공지사항 제목',
    id: 'title',
    renderCell: (row) => <span className="admin-data-table__title-cell">{row.title}</span>,
    track: '720fr',
  },
  {
    header: '상단고정',
    id: 'pinned',
    renderCell: (row) => renderAdminPinnedState(row.pinnedStatus),
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
] satisfies readonly AdminTableColumn<NoticeRow>[]

export function NoticePage() {
  return (
    <main className="portfolio-page" aria-label="공지사항 관리">
      <AdminDataTableSection
        bottomAction={{ href: '/notices/new', label: '신규 공지사항 등록' }}
        columns={noticeColumns}
        filters={noticeFilters}
        getRowKey={(row) => row.id}
        rows={noticeRows}
        search={{ label: '검색', placeholder: '공지사항 제목으로 검색해주세요.' }}
        title="공지사항 현황"
      />
    </main>
  )
}
