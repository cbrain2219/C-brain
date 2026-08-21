import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const reviewPagePath = new URL('../src/pages/ReviewPage.tsx', import.meta.url)
const tablePath = new URL(
  '../src/components/admin-table/AdminDataTableSection.tsx',
  import.meta.url,
)
const stylesPath = new URL(
  '../src/components/admin-table/AdminDataTableSection.css',
  import.meta.url,
)

test('review page copies the standalone public request URL from the leading action', async () => {
  const [page, table, styles] = await Promise.all([
    readFile(reviewPagePath, 'utf8'),
    readFile(tablePath, 'utf8'),
    readFile(stylesPath, 'utf8'),
  ])

  assert.match(page, /VITE_USER_APP_URL/)
  assert.match(page, /new URL\('\/reviews\/request', userAppUrl\)\.toString\(\)/)
  assert.match(page, /navigator\.clipboard\.writeText\(reviewRequestUrl\)/)
  assert.match(page, /후기 등록 링크를 복사했습니다\./)
  assert.match(page, /후기 등록 링크를 복사하지 못했습니다\./)
  assert.match(page, /bottomLeadingAction=\{\{/)
  assert.match(page, /label: '후기 등록 링크 복사'/)

  assert.match(table, /bottomLeadingAction\?: AdminTableButtonAction/)
  assert.match(table, /<AdminIcon name="link" size=\{20\} \/>/)
  assert.match(table, /className="admin-data-table-section__actions"/)
  assert.match(table, /<button[\s\S]*?bottomLeadingAction\.onClick[\s\S]*?<Link/)

  assert.match(
    styles,
    /\.admin-data-table-section__actions\s*\{[^}]*display:\s*flex;[^}]*gap:\s*8px;/s,
  )
  assert.match(
    styles,
    /\.admin-data-table-section__action--button\s*\{[^}]*border:\s*0;[^}]*cursor:\s*pointer;/s,
  )
})
