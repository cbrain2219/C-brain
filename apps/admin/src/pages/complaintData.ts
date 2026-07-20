export type ComplaintStatus = 'received' | 'processing' | 'resolved'

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

export const complaintStatusLabels = {
  processing: '처리 중',
  received: '접수',
  resolved: '처리 완료',
} as const satisfies Record<ComplaintStatus, string>

const fixtureAttachmentDownloadUrl =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL8bQAAAABJRU5ErkJggg=='

export const complaintRecords: readonly ComplaintRecord[] = [
  {
    attachments: [
      {
        downloadUrl: fixtureAttachmentDownloadUrl,
        id: 'attachment-01',
        name: '불만 접수 내역 01.png',
        sizeLabel: '12MB',
      },
      {
        downloadUrl: fixtureAttachmentDownloadUrl,
        id: 'attachment-02',
        name: '불만 접수 내역 02.png',
        sizeLabel: '12MB',
      },
    ],
    complaintType: '결과물의 결함',
    createdAt: '26. 07. 20 14:30',
    detail:
      '수령한 브로슈어 일부에서 인쇄 번짐과 재단 오차가 확인됩니다. 첨부한 사진을 확인한 뒤 재제작 가능 여부를 안내해주세요.',
    email: 'customer@example.com',
    id: 'complaint-20260720-001',
    name: '김고객',
    phone: '010-1234-5678',
    phoneVerified: true,
    privacyAgreedAt: '26. 07. 20 14:28',
    service: '브로슈어 · 카탈로그',
    status: 'received',
  },
]

export function getComplaintRecord(id: string | undefined) {
  return complaintRecords.find((complaint) => complaint.id === id)
}
