import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const portfolioPageSource = await readFile(
  new URL('../src/pages/PortfolioPage.tsx', import.meta.url),
  'utf8',
)

test('portfolio list shows pinned state next to landing state', () => {
  const headers = Array.from(
    portfolioPageSource.matchAll(/header: '([^']+)'/g),
    (match) => match[1],
  )

  assert.deepEqual(headers, [
    '상태',
    '유형',
    '포트폴리오 제목',
    '고객사',
    '랜딩',
    '상단고정',
    '조회수',
    '등록일자',
    '상세',
  ])
  assert.match(
    portfolioPageSource,
    /function renderPinned[\s\S]*?row\.isPinned[\s\S]*?>고정<[\s\S]*?return <span>-<\/span>/,
  )
})
