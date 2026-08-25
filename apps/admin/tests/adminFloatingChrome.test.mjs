import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const headerStylesPath = new URL(
  '../src/components/AdminHeader.css',
  import.meta.url,
)
const tablePath = new URL(
  '../src/components/admin-table/AdminDataTableSection.tsx',
  import.meta.url,
)
const tableStylesPath = new URL(
  '../src/components/admin-table/AdminDataTableSection.css',
  import.meta.url,
)
const iconsPath = new URL(
  '../src/components/AdminIcon.tsx',
  import.meta.url,
)

test('admin header and list actions remain visible while scrolling', async () => {
  const [headerStyles, table, tableStyles, icons] = await Promise.all([
    readFile(headerStylesPath, 'utf8'),
    readFile(tablePath, 'utf8'),
    readFile(tableStylesPath, 'utf8'),
    readFile(iconsPath, 'utf8'),
  ])

  assert.match(
    headerStyles,
    /\.admin-header\s*\{[^}]*position:\s*sticky;[^}]*z-index:\s*50;[^}]*top:\s*0;/s,
  )
  assert.match(
    tableStyles,
    /\.admin-data-table-section__actions\s*\{[^}]*position:\s*fixed;[^}]*z-index:\s*40;[^}]*right:\s*max\(32px, calc\(\(100vw - 1376px\) \/ 2\)\);[^}]*bottom:\s*32px;/s,
  )
  assert.match(
    table,
    /<\/section>\s*\{bottomLeadingAction \|\| bottomAction \? \(/,
  )
  assert.match(icons, /link:\s*\{[\s\S]*?M6\.14876 8\.49164/)
  assert.match(icons, /link:\s*\{[\s\S]*?strokeWidth:\s*2/)
  assert.match(icons, /link:\s*\{[\s\S]*?viewBox:\s*'0 0 20 20'/)
})

test('new content links reload the document like detail links', async () => {
  const table = await readFile(tablePath, 'utf8')

  assert.match(
    table,
    /<Link[\s\S]*?className="admin-data-table-section__action pretendard-bold-14"[\s\S]*?reloadDocument[\s\S]*?to=\{bottomAction\.href\}/,
  )
})
