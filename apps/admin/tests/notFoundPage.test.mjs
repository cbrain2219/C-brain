import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const appPath = new URL('../src/App.tsx', import.meta.url)
const pagePath = new URL('../src/pages/NotFoundPage.tsx', import.meta.url)
const stylesPath = new URL('../src/pages/NotFoundPage.css', import.meta.url)

test('unknown admin routes render a dedicated 404 page', async () => {
  const [appSource, pageSource, stylesSource] = await Promise.all([
    readFile(appPath, 'utf8'),
    readFile(pagePath, 'utf8'),
    readFile(stylesPath, 'utf8'),
  ])

  assert.match(
    appSource,
    /import \{ NotFoundPage \} from ['"]\.\/pages\/NotFoundPage['"]/,
  )
  assert.match(
    appSource,
    /<Route element=\{<NotFoundPage \/>\} path=['"]\*['"] \/>/,
  )
  assert.match(pageSource, /페이지를 찾을 수 없습니다\./)
  assert.match(pageSource, /to=['"]\/products['"]/)
  assert.match(pageSource, /상품 관리로 돌아가기/)
  assert.match(stylesSource, /padding:\s*0 32px 104px/)
  assert.match(stylesSource, /font-size:\s*clamp\(112px, 24vw, 224px\)/)
  assert.match(stylesSource, /text-shadow:/)
  assert.match(
    stylesSource,
    /\.admin-not-found__action\s*\{[^}]*width:\s*148px;[^}]*height:\s*52px;[^}]*border-radius:\s*32px;[^}]*background:\s*linear-gradient\(90deg, var\(--admin-brand-500\) 0%, var\(--admin-brand-600\) 100%\);/s,
  )
  assert.match(
    stylesSource,
    /@media \(max-width: 1120px\)[\s\S]*?\.admin-not-found__action\s*\{[^}]*width:\s*136px;[^}]*height:\s*48px;/,
  )
})
