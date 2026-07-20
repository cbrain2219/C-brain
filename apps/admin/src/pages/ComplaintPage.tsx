import { AdminDataTableSection } from '../components/admin-table/AdminDataTableSection'
import type {
  AdminTableColumn,
  AdminTableFilter,
} from '../components/admin-table/AdminDataTableSection'
import { complaintRecords, complaintStatusLabels } from './complaintData'
import type { ComplaintStatus } from './complaintData'
import './PortfolioPage.css'

type ComplaintRow = {
  readonly attachmentCount: number
  readonly complaintType: string
  readonly createdAt: string
  readonly detail: string
  readonly detailHref: string
  readonly id: string
  readonly name: string
  readonly service: string
  readonly status: ComplaintStatus
}

const complaintRows: readonly ComplaintRow[] = complaintRecords.map((complaint) => ({
  attachmentCount: complaint.attachments.length,
  complaintType: complaint.complaintType,
  createdAt: complaint.createdAt,
  detail: complaint.detail,
  detailHref: `/complaints/${complaint.id}`,
  id: complaint.id,
  name: complaint.name,
  service: complaint.service,
  status: complaint.status,
}))

const complaintFilters = [
  {
    id: 'status',
    label: '처리상태',
    options: ['전체', '접수', '처리 중', '처리 완료'],
  },
  {
    id: 'type',
    label: '불편 유형',
    options: [
      '불편 유형을 선택해주세요.',
      '대표에게 제보하기',
      '불친절한 서비스',
      '결과물의 결함',
      '기타',
    ],
  },
] satisfies readonly AdminTableFilter[]

function renderComplaintStatus(row: ComplaintRow) {
  return (
    <span className="admin-data-table__status">
      <span className="admin-data-table__status-dot" />
      <span>{complaintStatusLabels[row.status]}</span>
    </span>
  )
}

const complaintColumns = [
  {
    header: '처리상태',
    id: 'status',
    renderCell: renderComplaintStatus,
    track: '120fr',
  },
  {
    header: '불편 유형',
    id: 'complaintType',
    renderCell: (row) => row.complaintType,
    track: '180fr',
  },
  {
    header: '이용 서비스',
    id: 'service',
    renderCell: (row) => row.service,
    track: '200fr',
  },
  {
    header: '접수자',
    id: 'name',
    renderCell: (row) => row.name,
    track: '120fr',
  },
  {
    header: '접수 내용',
    id: 'detail',
    renderCell: (row) => (
      <span className="admin-data-table__summary-cell" title={row.detail}>
        {row.detail}
      </span>
    ),
    track: '456fr',
  },
  {
    header: '첨부',
    id: 'attachments',
    renderCell: (row) => (row.attachmentCount > 0 ? `${row.attachmentCount}개` : '-'),
    track: '100fr',
  },
  {
    header: '접수일자',
    id: 'createdAt',
    renderCell: (row) => row.createdAt,
    track: '120fr',
  },
  {
    header: '상세',
    id: 'detailLink',
    renderCell: (row) => (
      <a className="admin-data-table__link" href={row.detailHref}>
        상세
      </a>
    ),
    track: '80fr',
  },
] satisfies readonly AdminTableColumn<ComplaintRow>[]

export function ComplaintPage() {
  return (
    <main className="portfolio-page" aria-label="불편접수 관리">
      <AdminDataTableSection
        columns={complaintColumns}
        emptyMessage="접수된 불편사항이 없습니다."
        filters={complaintFilters}
        getRowKey={(row) => row.id}
        rows={complaintRows}
        search={{
          label: '검색',
          placeholder: '접수자 또는 접수 내용으로 검색해주세요.',
        }}
        title="불편접수 현황"
      />
    </main>
  )
}
