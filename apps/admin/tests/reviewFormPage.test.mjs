import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const appPath = new URL('../src/App.tsx', import.meta.url)
const comboboxPath = new URL(
  '../src/components/admin-form/AdminTypeCombobox.tsx',
  import.meta.url,
)
const formPath = new URL('../src/pages/ReviewFormPage.tsx', import.meta.url)
const listPath = new URL('../src/pages/ReviewPage.tsx', import.meta.url)

test('review admin exposes create and edit routes', async () => {
  const [appSource, listSource] = await Promise.all([
    readFile(appPath, 'utf8'),
    readFile(listPath, 'utf8'),
  ])

  assert.match(
    appSource,
    /import \{ ReviewFormPage \} from '.\/pages\/ReviewFormPage'/,
  )
  assert.match(
    appSource,
    /<Route element=\{<ReviewFormPage \/>\} path="\/reviews\/new" \/>/,
  )
  assert.match(
    appSource,
    /<Route element=\{<ReviewFormPage \/>\} path="\/reviews\/:reviewId" \/>/,
  )
  assert.match(listSource, /href: ['"]\/reviews\/new['"]/)
  assert.match(listSource, /인터뷰 · 후기 제목으로 검색해주세요\./)
})

test('review form has one fixed selector and two conditional field branches', async () => {
  const formSource = await readFile(formPath, 'utf8')

  assert.match(formSource, /options=\{reviewTypes\}/)
  assert.doesNotMatch(formSource, /allowCustomValue/)
  assert.match(formSource, /\breadOnly\b/)
  assert.match(formSource, /form\.type === '인터뷰'/)
  assert.match(formSource, /form\.type === '후기'/)
  assert.match(formSource, /인터뷰 제목/)
  assert.match(formSource, /인터뷰 Slug/)
  assert.match(formSource, /인터뷰 영상/)
  assert.match(formSource, /URL\.createObjectURL\(file\)/)
  assert.match(formSource, /URL\.revokeObjectURL\(videoPreviewUrl\.current\)/)
  assert.match(formSource, /<video/)
  assert.match(formSource, /SEO Description/)
  assert.match(formSource, /후기 고객사/)
  assert.match(formSource, /후기 담당자/)
  assert.match(formSource, /\{type\} 내용/)
  assert.match(formSource, /name="isLandingEnabled"/)
  assert.match(formSource, /type="date"/)
  assert.match(formSource, /TEXT Editor 작성/)
  assert.match(formSource, /등록하기/)
  assert.doesNotMatch(formSource, /figma\.com\/api/)
})

test('review type validation is surfaced by the shared combobox', async () => {
  const [comboboxSource, formSource] = await Promise.all([
    readFile(comboboxPath, 'utf8'),
    readFile(formPath, 'utf8'),
  ])

  assert.match(comboboxSource, /readonly onInvalid\?: \(\) => void/)
  assert.match(comboboxSource, /onInvalid=\{onInvalid\}/)
  assert.match(comboboxSource, /readonly readOnly\?: boolean/)
  assert.match(comboboxSource, /readOnly=\{readOnly\}/)
  assert.match(formSource, /인터뷰 · 후기 유형을 선택해주세요\./)
})
