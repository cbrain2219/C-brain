import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const appPath = new URL('../src/App.tsx', import.meta.url)
const formPath = new URL('../src/pages/EbookFormPage.tsx', import.meta.url)
const headerPath = new URL('../src/components/AdminHeader.tsx', import.meta.url)
const listPath = new URL('../src/pages/EbookPage.tsx', import.meta.url)
const userHeaderPath = new URL(
  '../../user/app/_components/Header.tsx',
  import.meta.url,
)

test('E-book navigation and routes live in the admin app only', async () => {
  const [app, adminHeader, userHeader] = await Promise.all([
    readFile(appPath, 'utf8'),
    readFile(headerPath, 'utf8'),
    readFile(userHeaderPath, 'utf8'),
  ])

  assert.match(adminHeader, /label: 'E-book', to: '\/ebook'/)
  assert.match(app, /<Route element=\{<EbookPage \/>\} path="\/ebook" \/>/)
  assert.match(
    app,
    /<Route element=\{<EbookFormPage \/>\} path="\/ebook\/new" \/>/,
  )
  assert.match(app, /path="\/ebook\/:ebookId"/)
  assert.doesNotMatch(userHeader, /E-book/)
})

test('E-book list follows the designed table, search, copy, and create actions', async () => {
  const source = await readFile(listPath, 'utf8')

  for (const copy of [
    'E-book 등록 현황',
    'E-book 제목 (Title)',
    'E-book 제목으로 검색해주세요.',
    '신규 E-book 등록',
  ]) {
    assert.match(
      source,
      new RegExp(copy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    )
  }

  assert.match(source, /listAdminEbooks\(supabase\)/)
  assert.match(source, /navigator\.clipboard\.writeText\(publicUrl\)/)
  assert.match(source, /VITE_USER_APP_URL/)
  assert.match(source, />\s*미리보기\s*</)
  assert.match(source, /https:\/\/ebook\.cbrain\.kr/)
  assert.match(source, /href: '\/ebook\/new'/)
})

test('E-book registration manages one optional OG image and persists through Supabase', async () => {
  const source = await readFile(formPath, 'utf8')

  for (const copy of [
    '임베드 URL',
    'Slug',
    'OG Img',
    '이미지 추가',
    'IMAGE ALT TAG를 입력해주세요.',
    'Title',
    'SEO Description',
    '목록으로',
    '등록하기',
  ]) {
    assert.match(source, new RegExp(copy))
  }

  assert.match(source, /createEbook\(supabase, input\)/)
  assert.match(source, /updateEbook\(supabase, ebookId, input\)/)
  assert.match(source, /deleteEbook\(supabase, ebookId\)/)
  assert.match(source, /type="file"/)
  assert.match(
    source,
    /uploadPublicAsset\(\s*'ebook-og-images',\s*form\.ogImage,?\s*\)/,
  )
  assert.match(source, /deletePublicAssets\(\[persistedOgImagePath\]\)/)
  assert.match(source, /getPortfolioImageError/)
  assert.match(source, /파일을 드래그 또는 클릭 후 파일 업로드 \(0\/1\)/)
  assert.match(source, /sanitizeEbookEmbedUrl\(rawValue\)/)
  assert.match(source, /sanitizeEbookSlug\(rawValue\)/)
  assert.match(source, /pattern="\[a-z0-9\]\+\(\?:-\[a-z0-9\]\+\)\*"/)
  assert.match(source, /placeholder="E-book 제목을 입력해주세요\."/)
  assert.match(
    source,
    /placeholder="검색 결과에 표시될 E-book 설명을 입력해주세요\."/,
  )
  assert.doesNotMatch(source, /localStorage/)
})
