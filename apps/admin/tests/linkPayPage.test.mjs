import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const pagePath = new URL('../src/pages/LinkPayPage.tsx', import.meta.url)

test('LinkPay list loads rows, filters them, copies public URLs, and links details', async () => {
  const source = await readFile(pagePath, 'utf8')

  assert.match(source, /listAdminPaymentLinks\(supabase\)/)
  assert.match(source, /paymentLinks\.map\(toLinkPayListRow\)/)
  assert.match(source, /filterLinkPayRows/)
  assert.match(source, /new Set\(rows\.map\(\(row\) => row\.client\)\)/)
  assert.match(source, /buildLinkPayUrl/)
  assert.match(source, /navigator\.clipboard\.writeText/)
  assert.match(source, /VITE_USER_APP_URL/)
  assert.match(source, /to=\{row\.detailHref\}/)
  assert.match(source, /활성/)
  assert.match(source, /중단/)
  assert.match(source, /링크페이를 불러오는 중입니다\./)
  assert.match(source, /링크페이를 불러오지 못했습니다\./)
  assert.match(source, /링크페이 URL을 복사하지 못했습니다\./)
})
