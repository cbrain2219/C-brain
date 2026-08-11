import assert from 'node:assert/strict'
import test from 'node:test'
import {
  changeProductFormType,
  createProductFormDraft,
  getActiveProductUiDraft,
  replaceActiveProductUiDraft,
  selectProductFormVariant,
} from '../src/pages/productFormGroup.ts'

test('compound products own every configured variant in display order', () => {
  assert.deepEqual(
    Object.keys(createProductFormDraft('포스터 · 전단지').variants),
    ['포스터', '전단지'],
  )
  assert.deepEqual(
    Object.keys(createProductFormDraft('배너 · 족자 · 현수막').variants),
    ['배너', '족자', '현수막'],
  )
  assert.deepEqual(
    Object.keys(createProductFormDraft('명함 · 봉투').variants),
    ['명함', '봉투'],
  )

  const draft = createProductFormDraft('포스터 · 전단지')

  assert.equal(draft.activeVariant, '포스터')
})

test('simple products use their category name as the sole variant', () => {
  const draft = createProductFormDraft('브로슈어 · 카탈로그')

  assert.equal(draft.activeVariant, '브로슈어 · 카탈로그')
  assert.deepEqual(Object.keys(draft.variants), ['브로슈어 · 카탈로그'])
})

test('switching segmented variants preserves unsaved values', () => {
  let draft = createProductFormDraft('포스터 · 전단지')
  const poster = getActiveProductUiDraft(draft)

  draft = replaceActiveProductUiDraft(draft, {
    ...poster,
    optionValues: { ...poster.optionValues, size: ['수정한 포스터 크기'] },
  })
  draft = selectProductFormVariant(draft, '전단지')
  assert.deepEqual(getActiveProductUiDraft(draft).optionValues.size, [''])

  draft = selectProductFormVariant(draft, '포스터')
  assert.deepEqual(getActiveProductUiDraft(draft).optionValues.size, [
    '수정한 포스터 크기',
  ])
})

test('changing category replaces the complete variant set', () => {
  const poster = createProductFormDraft('포스터 · 전단지')
  const display = changeProductFormType(poster, '배너 · 족자 · 현수막')

  assert.equal(display.activeVariant, '배너')
  assert.deepEqual(Object.keys(display.variants), ['배너', '족자', '현수막'])
})

test('unsupported segmented variants are rejected', () => {
  const draft = createProductFormDraft('포스터 · 전단지')

  assert.throws(() => selectProductFormVariant(draft, '명함'), {
    message: '지원하지 않는 상품 세부 유형입니다.',
  })
})
