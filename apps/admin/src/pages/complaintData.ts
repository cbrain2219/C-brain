export const complaintStatuses = ['received', 'processing', 'resolved'] as const

export type ComplaintStatus = (typeof complaintStatuses)[number]

export type ComplaintAttachmentSource = {
  readonly bucket: string
  readonly file_name: string
  readonly file_size: number | null
  readonly id: string
  readonly path: string
}

export type ComplaintSource = {
  readonly complaint_type: string
  readonly content: string
  readonly created_at: string
  readonly email: string
  readonly id: string
  readonly inquiry_attachments?: readonly ComplaintAttachmentSource[] | null
  readonly name: string
  readonly phone: string
  readonly phone_verified: boolean
  readonly privacy_agreed_at: string | null
  readonly service: string
  readonly status: ComplaintStatus
}

export type ComplaintAttachment = {
  readonly downloadUrl: string
  readonly id: string
  readonly name: string
  readonly sizeLabel: string
}

export type ComplaintRecord = {
  readonly attachments: readonly ComplaintAttachment[]
  readonly complaintType: string
  readonly createdAt: string
  readonly detail: string
  readonly email: string
  readonly id: string
  readonly name: string
  readonly phone: string
  readonly phoneVerified: boolean
  readonly privacyAgreedAt: string
  readonly service: string
  readonly status: ComplaintStatus
}

export type ComplaintRow = {
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

export type ComplaintFilters = {
  readonly query: string
  readonly status: string
  readonly type: string
}

export const complaintStatusLabels = {
  processing: '처리 중',
  received: '접수',
  resolved: '처리 완료',
} as const satisfies Record<ComplaintStatus, string>

const dateTimeFormatter = new Intl.DateTimeFormat('ko-KR', {
  day: '2-digit',
  hour: '2-digit',
  hourCycle: 'h23',
  minute: '2-digit',
  month: '2-digit',
  timeZone: 'Asia/Seoul',
  year: '2-digit',
})

export function isComplaintStatus(value: string): value is ComplaintStatus {
  return complaintStatuses.includes(value as ComplaintStatus)
}

export function formatComplaintDateTime(value: string | null) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '-'

  const parts = Object.fromEntries(
    dateTimeFormatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  )

  return `${parts.year}. ${parts.month}. ${parts.day} ${parts.hour}:${parts.minute}`
}

export function formatComplaintFileSize(bytes: number | null) {
  if (bytes === null || bytes < 0) return '-'
  if (bytes < 1024) return `${bytes}B`

  const megabytes = bytes / (1024 * 1024)

  return megabytes < 1
    ? `${Math.round(bytes / 1024)}KB`
    : `${new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 }).format(megabytes)}MB`
}

export function toComplaintRow(inquiry: ComplaintSource): ComplaintRow {
  return {
    attachmentCount: inquiry.inquiry_attachments?.length ?? 0,
    complaintType: inquiry.complaint_type,
    createdAt: formatComplaintDateTime(inquiry.created_at),
    detail: inquiry.content,
    detailHref: `/complaints/${inquiry.id}`,
    id: inquiry.id,
    name: inquiry.name,
    service: inquiry.service,
    status: inquiry.status,
  }
}

export function toComplaintRecord(
  inquiry: ComplaintSource,
  attachmentDownloadUrls: Readonly<Record<string, string>> = {},
): ComplaintRecord {
  return {
    attachments: (inquiry.inquiry_attachments ?? []).map((attachment) => ({
      downloadUrl: attachmentDownloadUrls[attachment.id] ?? '',
      id: attachment.id,
      name: attachment.file_name,
      sizeLabel: formatComplaintFileSize(attachment.file_size),
    })),
    complaintType: inquiry.complaint_type,
    createdAt: formatComplaintDateTime(inquiry.created_at),
    detail: inquiry.content,
    email: inquiry.email,
    id: inquiry.id,
    name: inquiry.name,
    phone: inquiry.phone,
    phoneVerified: inquiry.phone_verified,
    privacyAgreedAt: formatComplaintDateTime(inquiry.privacy_agreed_at),
    service: inquiry.service,
    status: inquiry.status,
  }
}

export function filterComplaintRows(
  rows: readonly ComplaintRow[],
  filters: ComplaintFilters,
) {
  const query = filters.query.trim().toLocaleLowerCase('ko-KR')

  return rows.filter((row) => {
    if (filters.status !== '전체' && complaintStatusLabels[row.status] !== filters.status) {
      return false
    }
    if (filters.type !== '전체' && row.complaintType !== filters.type) return false

    return (
      !query ||
      row.name.toLocaleLowerCase('ko-KR').includes(query) ||
      row.detail.toLocaleLowerCase('ko-KR').includes(query)
    )
  })
}
