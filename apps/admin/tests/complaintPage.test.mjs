import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  complaintRecords,
  getComplaintRecord,
} from '../src/pages/complaintData.ts'

const appPath = new URL('../src/App.tsx', import.meta.url)
const detailPagePath = new URL('../src/pages/ComplaintDetailPage.tsx', import.meta.url)
const detailStylesPath = new URL('../src/pages/ComplaintDetailPage.css', import.meta.url)
const pagePath = new URL('../src/pages/ComplaintPage.tsx', import.meta.url)
const tableStylesPath = new URL(
  '../src/components/admin-table/AdminDataTableSection.css',
  import.meta.url,
)

test('complaint list exposes intake-backed columns without an admin create action', async () => {
  const [appSource, pageSource, tableStylesSource] = await Promise.all([
    readFile(appPath, 'utf8'),
    readFile(pagePath, 'utf8'),
    readFile(tableStylesPath, 'utf8'),
  ])
  const headers = Array.from(
    pageSource.matchAll(/header: '([^']+)'/g),
    (match) => match[1],
  )

  assert.deepEqual(headers, [
    '처리상태',
    '불편 유형',
    '이용 서비스',
    '접수자',
    '접수 내용',
    '첨부',
    '접수일자',
    '상세',
  ])
  assert.match(pageSource, /title="불편접수 현황"/)
  assert.match(pageSource, /emptyMessage="접수된 불편사항이 없습니다\."/)
  assert.match(
    pageSource,
    /placeholder: '접수자 또는 접수 내용으로 검색해주세요\.'/,
  )
  assert.match(
    pageSource,
    /options: \[\s*'불편 유형을 선택해주세요\.',\s*'대표에게 제보하기',\s*'불친절한 서비스',\s*'결과물의 결함',\s*'기타',\s*\]/,
  )
  assert.doesNotMatch(pageSource, /bottomAction=/)
  assert.match(
    appSource,
    /import \{ ComplaintPage \} from '\.\/pages\/ComplaintPage'/,
  )
  assert.match(
    appSource,
    /<Route element=\{<ComplaintPage \/>\} path="\/complaints" \/>/,
  )
  assert.match(
    tableStylesSource,
    /\.admin-data-table__summary-cell\s*\{[\s\S]*?overflow:\s*hidden;[\s\S]*?text-overflow:\s*ellipsis;/,
  )
})

test('complaint fixture supports list and detail lookup', () => {
  const complaint = complaintRecords[0]

  assert.equal(complaint.id, 'complaint-20260720-001')
  assert.equal(complaint.attachments.length, 2)
  assert.ok(complaint.attachments.every((attachment) => attachment.downloadUrl))
  assert.equal(getComplaintRecord(complaint.id), complaint)
  assert.equal(getComplaintRecord('missing'), undefined)
})

test('complaint detail exposes admin-only intake information', async () => {
  const [appSource, detailSource, detailStyles] = await Promise.all([
    readFile(appPath, 'utf8'),
    readFile(detailPagePath, 'utf8'),
    readFile(detailStylesPath, 'utf8'),
  ])

  assert.match(appSource, /path="\/complaints\/:complaintId"/)
  assert.match(appSource, /import \{ Toaster \} from 'sonner'/)
  assert.match(appSource, /<Toaster \/>/)
  for (const text of [
    '불편접수 상세',
    '접수 정보',
    '접수자 정보',
    '상세 내용',
    '첨부 파일',
    '휴대폰 인증',
    '개인정보 동의',
    '목록으로',
  ]) {
    assert.match(detailSource, new RegExp(text))
  }
  assert.match(detailStyles, /\.complaint-detail__definition-grid/)
  assert.match(detailSource, /import \{ toast \} from 'sonner'/)
  assert.match(detailSource, /navigator\.clipboard\s*\.writeText\(value\)/)
  assert.match(detailSource, /toast\.success\('복사되었습니다\.'\)/)
  assert.match(detailSource, /copyable label="이메일"/)
  assert.match(detailSource, /copyable label="휴대폰 번호"/)
  assert.match(detailSource, /download=\{attachment\.name\}/)
  assert.match(detailSource, /href=\{attachment\.downloadUrl\}/)
  assert.match(detailSource, /complaint-detail__bottom-actions/)
  assert.match(detailStyles, /@media \(max-width: 720px\)/)
})
