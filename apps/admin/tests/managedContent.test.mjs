import assert from 'node:assert/strict'
import test from 'node:test'

import {
  EMPTY_TIPTAP_DOCUMENT,
  ManagedContentSchemaError,
  convertLegacyTextToRaw,
  convertLegacyTextToWysiwyg,
  createInitialManagedContentValue,
  managedContentDocumentIsEmpty,
  managedContentFormFromRow,
  managedContentInputFromForm,
  managedContentIsEmpty,
  switchRawToWysiwyg,
  switchWysiwygToRaw,
} from '../src/lib/managedContent.ts'

const scope = '00000000-0000-4000-8000-0000000000ab'

function row(overrides = {}) {
  return {
    content: '<p>저장된 HTML</p>',
    content_asset_scope: scope,
    content_authoring_mode: 'raw_html',
    content_json: null,
    content_mode: 'html',
    content_schema_version: 1,
    content_source_backup: null,
    ...overrides,
  }
}

test('creates raw HTML content with an empty recoverable editor document', () => {
  const initial = createInitialManagedContentValue('raw_html')

  assert.equal(initial.content, '')
  assert.equal(initial.contentAuthoringMode, 'raw_html')
  assert.equal(initial.contentMode, 'html')
  assert.equal(managedContentDocumentIsEmpty(initial.contentJson), true)
  assert.equal(
    managedContentDocumentIsEmpty({ type: 'doc', content: [{ type: 'horizontalRule' }] }),
    false,
  )
  assert.equal(
    managedContentDocumentIsEmpty({ type: 'doc', content: [{ type: 'image' }] }),
    false,
  )
})

test('maps managed rows without converting legacy Markdown', () => {
  const html = managedContentFormFromRow(row())
  const markdown = managedContentFormFromRow(
    row({ content: '# 원문', content_mode: 'markdown' }),
  )

  assert.equal(html.contentAuthoringMode, 'raw_html')
  assert.equal(markdown.content, '# 원문')
  assert.equal(markdown.contentMode, 'markdown')
  assert.equal(markdown.contentAuthoringMode, 'raw_html')
})

test('rejects malformed managed rows instead of best-effort editing', () => {
  assert.throws(
    () => managedContentFormFromRow(row({ content_schema_version: 2 })),
    ManagedContentSchemaError,
  )
  assert.throws(
    () => managedContentFormFromRow(row({ content_asset_scope: '../scope' })),
    ManagedContentSchemaError,
  )
  assert.throws(
    () => managedContentFormFromRow(row({ content_json: [] })),
    ManagedContentSchemaError,
  )
  assert.throws(
    () =>
      managedContentFormFromRow(
        row({
          content_authoring_mode: 'wysiwyg',
          content_json: { type: 'doc' },
          content_mode: 'markdown',
        }),
      ),
    ManagedContentSchemaError,
  )
})

test('rejects malformed nested Tiptap nodes from rows and form values', () => {
  const html = managedContentFormFromRow(row())
  const malformedDocuments = [
    { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 42 }] }] },
    { type: 'doc', content: { type: 'paragraph' } },
    { type: 'doc', content: [{ type: 'paragraph', text: 42 }] },
    { type: 'doc', content: [{ type: 'image', attrs: [] }] },
    { type: 'doc', content: [{ type: 'text', marks: [[]] }] },
  ]

  for (const document of malformedDocuments) {
    assert.throws(
      () => managedContentFormFromRow(row({ content_json: document })),
      ManagedContentSchemaError,
    )
    assert.equal(managedContentInputFromForm({ ...html, contentJson: document }), null)
    assert.equal(
      managedContentInputFromForm({
        ...html,
        contentAuthoringMode: 'wysiwyg',
        contentJson: document,
      }),
      null,
    )
    assert.equal(
      managedContentIsEmpty({
        ...html,
        contentAuthoringMode: 'wysiwyg',
        contentJson: document,
      }),
      true,
    )
  }
})

test('serializes only canonical managed-content values', () => {
  const wysiwyg = {
    ...managedContentFormFromRow(row()),
    content: '<p>본문</p>',
    contentAuthoringMode: 'wysiwyg',
    contentJson: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '본문' }] }] },
  }

  assert.deepEqual(managedContentInputFromForm(wysiwyg), {
    content: '<p>본문</p>',
    content_asset_scope: scope,
    content_authoring_mode: 'wysiwyg',
    content_json: wysiwyg.contentJson,
    content_mode: 'html',
    content_schema_version: 1,
    content_source_backup: null,
  })
  assert.equal(managedContentInputFromForm({ ...wysiwyg, contentJson: [] }), null)
  assert.equal(managedContentInputFromForm({ ...wysiwyg, contentMode: 'markdown' }), null)
  assert.equal(managedContentInputFromForm({ ...wysiwyg, contentAssetScope: 'bad-scope' }), null)
})

test('identifies semantic WYSIWYG emptiness while preserving raw source bytes', () => {
  const wysiwyg = {
    ...managedContentFormFromRow(row()),
    content: '<p></p>',
    contentAuthoringMode: 'wysiwyg',
    contentJson: { type: 'doc', content: [{ type: 'paragraph' }] },
  }

  assert.equal(managedContentIsEmpty(wysiwyg), true)
  assert.equal(
    managedContentIsEmpty({
      ...wysiwyg,
      contentJson: { type: 'doc', content: [{ type: 'horizontalRule' }] },
    }),
    false,
  )
  assert.equal(
    managedContentIsEmpty({
      ...wysiwyg,
      contentJson: { type: 'doc', content: [{ type: 'image' }] },
    }),
    false,
  )
  assert.equal(managedContentInputFromForm({ ...wysiwyg, contentAuthoringMode: 'raw_html', contentJson: null, content: '  <p>원문</p>  ' }).content, '  <p>원문</p>  ')
})

test('switches authoring modes without discarding inactive source or document', () => {
  const raw = managedContentFormFromRow(row({ content: '  <p>원문</p>  ' }))
  const wysiwyg = switchRawToWysiwyg(raw, 'restore_previous')

  assert.equal(wysiwyg.content, '')
  assert.equal(wysiwyg.contentMode, 'html')
  assert.equal(wysiwyg.contentSourceBackup, raw.content)
  assert.deepEqual(wysiwyg.contentJson, EMPTY_TIPTAP_DOCUMENT)

  const generated = switchWysiwygToRaw(
    { ...wysiwyg, content: '<p>생성됨</p>' },
    'generated',
  )
  assert.equal(generated.content, '<p>생성됨</p>')
  assert.deepEqual(generated.contentJson, wysiwyg.contentJson)

  const restored = switchWysiwygToRaw(
    { ...wysiwyg, content: '<p>생성됨</p>' },
    'backup',
  )
  assert.equal(restored.content, raw.content)

  const newDocument = switchRawToWysiwyg(raw, 'new_from_current_backup')
  assert.equal(newDocument.contentSourceBackup, raw.content)
  assert.deepEqual(newDocument.contentJson, EMPTY_TIPTAP_DOCUMENT)
})

test('restoring a previous WYSIWYG document retains the latest raw HTML source', () => {
  const previousDocument = {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: '이전 문서' }] }],
  }
  const raw = managedContentFormFromRow(
    row({
      content: '  <p>B 원문</p>  ',
      content_json: previousDocument,
      content_source_backup: '<p>A 원문</p>',
    }),
  )

  const restoredDocument = switchRawToWysiwyg(raw, 'restore_previous')
  const restoredRaw = switchWysiwygToRaw(restoredDocument, 'backup')

  assert.deepEqual(restoredDocument.contentJson, previousDocument)
  assert.equal(restoredRaw.content, '  <p>B 원문</p>  ')
})

test('raw mode round-trips its inactive document and backup through a mutation', () => {
  const inactiveDocument = {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: '보관된 문서' }] }],
  }
  const raw = managedContentFormFromRow(
    row({
      content: '  <p>최신 HTML</p>  ',
      content_json: inactiveDocument,
      content_source_backup: '<p>이전 HTML</p>',
    }),
  )
  const mutation = managedContentInputFromForm(raw)
  assert.ok(mutation)

  const reloaded = managedContentFormFromRow(mutation)
  const wysiwyg = switchRawToWysiwyg(reloaded, 'restore_previous')
  const rawAgain = switchWysiwygToRaw(wysiwyg, 'backup')

  assert.deepEqual(reloaded.contentJson, inactiveDocument)
  assert.equal(reloaded.contentSourceBackup, '<p>이전 HTML</p>')
  assert.deepEqual(wysiwyg.contentJson, inactiveDocument)
  assert.equal(rawAgain.content, '  <p>최신 HTML</p>  ')
})

test('converts legacy text only on an explicit conversion choice', () => {
  const legacy = managedContentFormFromRow(
    row({ content: '첫 줄\n둘째 <줄>', content_mode: 'markdown' }),
  )
  const raw = convertLegacyTextToRaw(legacy)
  const wysiwyg = convertLegacyTextToWysiwyg(legacy)

  assert.equal(raw.content, '<p>첫 줄<br>둘째 &lt;줄&gt;</p>')
  assert.equal(raw.contentSourceBackup, '<p>첫 줄<br>둘째 &lt;줄&gt;</p>')
  assert.equal(wysiwyg.content, '')
  assert.equal(wysiwyg.contentSourceBackup, '<p>첫 줄<br>둘째 &lt;줄&gt;</p>')
  assert.deepEqual(wysiwyg.contentJson, {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: '첫 줄' },
          { type: 'hardBreak' },
          { type: 'text', text: '둘째 <줄>' },
        ],
      },
    ],
  })
})
