import assert from 'node:assert/strict'
import test from 'node:test'

import {
  complaintStatusLabels,
  filterComplaintRows,
  formatComplaintDateTime,
  formatComplaintFileSize,
  isComplaintStatus,
  toComplaintRecord,
  toComplaintRow,
} from '../src/pages/complaintData.ts'

const complaint = {
  complaint_type: '결과물의 결함',
  content: '인쇄 번짐을 확인해주세요.',
  created_at: '2026-07-21T05:30:00.000Z',
  email: 'customer@example.com',
  id: 'complaint-1',
  complaint_attachments: [
    {
      bucket_id: 'private-attachments',
      file_size: 12 * 1024 * 1024,
      id: 'attachment-1',
      object_path: 'complaints/complaint-1/proof.png',
      original_file_name: 'proof.png',
    },
  ],
  name: '김고객',
  phone: '01012345678',
  phone_verified: true,
  privacy_agreed_at: '2026-07-21T05:28:00.000Z',
  service: '브로슈어 · 카탈로그',
  status: 'received',
}

test('complaint data maps to list and detail models', () => {
  const row = toComplaintRow(complaint)
  const record = toComplaintRecord(complaint, {
    'attachment-1': 'https://storage.example/signed',
  })

  assert.deepEqual(row, {
    attachmentCount: 1,
    complaintType: '결과물의 결함',
    createdAt: '26. 07. 21 14:30',
    detail: '인쇄 번짐을 확인해주세요.',
    detailHref: '/complaints/complaint-1',
    id: 'complaint-1',
    name: '김고객',
    service: '브로슈어 · 카탈로그',
    status: 'received',
  })
  assert.equal(record.attachments[0].downloadUrl, 'https://storage.example/signed')
  assert.equal(record.attachments[0].name, 'proof.png')
  assert.equal(record.attachments[0].sizeLabel, '12MB')
  assert.equal(record.phoneVerified, true)
  assert.equal(record.privacyAgreedAt, '26. 07. 21 14:28')
})

test('complaint filters combine status label, type, and text query', () => {
  const rows = [
    toComplaintRow(complaint),
    toComplaintRow({
      ...complaint,
      complaint_type: '기타',
      content: '배송 문의입니다.',
      id: 'complaint-2',
      complaint_attachments: [],
      name: '이고객',
      status: 'resolved',
    }),
  ]

  assert.deepEqual(
    filterComplaintRows(rows, {
      query: '인쇄',
      status: '접수',
      type: '결과물의 결함',
    }),
    [rows[0]],
  )
  assert.deepEqual(
    filterComplaintRows(rows, { query: '이고객', status: '전체', type: '전체' }),
    [rows[1]],
  )
})

test('status and formatting helpers reject invalid values safely', () => {
  assert.equal(complaintStatusLabels.processing, '처리 중')
  assert.equal(isComplaintStatus('resolved'), true)
  assert.equal(isComplaintStatus('closed'), false)
  assert.equal(formatComplaintDateTime('invalid'), '-')
  assert.equal(formatComplaintFileSize(null), '-')
  assert.equal(formatComplaintFileSize(1536), '2KB')
})
