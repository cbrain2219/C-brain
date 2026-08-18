import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const root = new URL('../src/', import.meta.url)

async function source(path) {
  return readFile(new URL(path, root), 'utf8')
}

test('every managed-content form delegates body authoring to the shared editor', async () => {
  const [blog, notice, portfolio, review, editor] = await Promise.all([
    source('pages/BlogFormPage.tsx'),
    source('pages/NoticeFormPage.tsx'),
    source('pages/PortfolioFormPage.tsx'),
    source('pages/ReviewFormPage.tsx'),
    source('components/admin-editor/AdminContentEditor.tsx'),
  ])

  for (const [page, entity] of [
    [blog, 'blog'],
    [notice, 'notice'],
    [portfolio, 'portfolio'],
    [review, 'review'],
  ]) {
    assert.match(page, /<AdminContentEditor/)
    assert.match(page, new RegExp(`entity="${entity}"`))
    assert.match(page, /documentKey=\{contentEditorDocumentKey\}/)
    assert.match(page, /onBusyChange=/)
    assert.match(page, /onPendingAssetCountChange=/)
  }

  assert.match(editor, />\s*HTML 작성\s*</)
  assert.match(editor, />\s*TEXT Editor 작성\s*</)
  assert.match(editor, /lazy\(async \(\) =>/)
})

test('each form locks actions and removes its body scope only after the row deletion', async () => {
  const [blog, notice, portfolio, review] = await Promise.all([
    source('pages/BlogFormPage.tsx'),
    source('pages/NoticeFormPage.tsx'),
    source('pages/PortfolioFormPage.tsx'),
    source('pages/ReviewFormPage.tsx'),
  ])

  for (const [page, deleteCall, entity] of [
    [blog, 'deletePost', 'blog'],
    [notice, 'deletePost', 'notice'],
    [portfolio, 'deletePortfolioItem', 'portfolio'],
    [review, 'deleteReview', 'review'],
  ]) {
    assert.match(page, /const actionLocked = isSaving \|\| isDeleting \|\| contentEditorState\.busy/)
    assert.match(page, /const operationInFlight = useRef\(false\)/)
    assert.match(page, /if \(actionLocked \|\| operationInFlight\.current\) return/)
    assert.match(page, /operationInFlight\.current = true/)
    assert.match(page, /operationInFlight\.current = false/)
    const deleteAt = page.indexOf(`await ${deleteCall}`)
    const cleanupAt = page.indexOf(`removeContentAssetScope('${entity}'`)
    assert.ok(deleteAt >= 0 && cleanupAt > deleteAt)
  }
})

test('each visible back link is action-lock aware', async () => {
  const pages = await Promise.all([
    source('pages/BlogFormPage.tsx'),
    source('pages/NoticeFormPage.tsx'),
    source('pages/PortfolioFormPage.tsx'),
    source('pages/ReviewFormPage.tsx'),
  ])

  for (const page of pages) {
    const visibleBackLinks = page.match(/목록으로/g)?.length ?? 0
    const guardedBackLinks = page.match(/aria-disabled=\{actionLocked \|\| undefined\}/g)?.length ?? 0

    assert.ok(visibleBackLinks > 0)
    assert.equal(guardedBackLinks, visibleBackLinks)
    assert.match(page, /if \(actionLocked\) event\.preventDefault\(\)/)
    assert.match(page, /tabIndex=\{actionLocked \? -1 : undefined\}/)
  }
})

test('the shared editor installs callback guards after commit and keeps mode locks for pending work', async () => {
  const [editor, stateHook] = await Promise.all([
    source('components/admin-editor/AdminContentEditor.tsx'),
    source('hooks/useManagedContentEditorState.ts'),
  ])

  assert.match(editor, /useLayoutEffect\(\(\) =>/)
  assert.match(editor, /const modeControlsDisabled = disabled \|\| pendingAssetCount > 0/)
  assert.match(editor, /disabled=\{modeControlsDisabled\}/)
  assert.match(editor, /const isBusy = pendingAssetCount > 0/)
  assert.match(stateHook, /useLayoutEffect\(\(\) =>/)
  assert.match(stateHook, /!committed\.active \|\| committed\.documentKey !== documentKey/)
})
