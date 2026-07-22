import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

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
  assert.match(pageSource, /'접수된 불편사항이 없습니다\.'/)
  assert.match(
    pageSource,
    /placeholder: '접수자 또는 접수 내용으로 검색해주세요\.'/,
  )
  assert.match(pageSource, /listAdminInquiries\(supabase\)/)
  assert.match(pageSource, /inquiries\.map\(toComplaintRow\)/)
  assert.match(pageSource, /filterValues=\{\{ status: filters\.status, type: filters\.type \}\}/)
  assert.match(pageSource, /onFilterValueChange=\{handleFilterValueChange\}/)
  assert.match(pageSource, /searchValue=\{filters\.query\}/)
  assert.doesNotMatch(pageSource, /isAcceptDrag/)
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
  assert.match(detailSource, /getAdminInquiry\(supabase, id\)/)
  assert.match(detailSource, /createSignedFileUrl\(/)
  assert.match(detailSource, /STORAGE_BUCKETS\.privateAttachments/)
  assert.match(detailSource, /Promise\.allSettled\(/)
  assert.match(detailSource, /result\.status === 'fulfilled'/)
  assert.match(detailSource, /attachment\.downloadUrl \?/)
  assert.match(detailSource, /일부 첨부 파일을 불러오지 못했습니다\./)
  assert.match(detailSource, /다운로드 불가/)
  assert.match(detailSource, /updateInquiryStatus\(supabase, complaint\.id, value\)/)
  assert.match(detailSource, /toast\.success\('처리상태를 변경했습니다\.'\)/)
  assert.match(detailSource, /toast\.error\('처리상태를 변경하지 못했습니다\.'\)/)
  assert.match(detailSource, /window\.alert\('처리상태를 변경하지 못했습니다\. 다시 시도해주세요\.'\)/)
  assert.match(detailSource, /value=\{complaint\.status\}/)
  assert.match(detailSource, /complaint-detail__bottom-actions/)
  assert.match(detailStyles, /\.complaint-detail__status-select/)
  assert.match(detailStyles, /@media \(max-width: 720px\)/)
})
