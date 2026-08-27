import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createEbookPublicUrl,
  createEbookPreviewUrl,
  createInitialEbookForm,
  isValidEbookSlug,
  isValidEbookUrl,
  normalizeEbookEmbedUrl,
  sanitizeEbookEmbedUrl,
  sanitizeEbookSlug,
  toEbookFormState,
  toEbookListRow,
  toEbookMutationInput,
} from '../src/pages/ebookData.ts'

const ebook = {
  created_at: '2026-03-16T03:00:00.000Z',
  embed_url: 'https://example.com/ebooks/design-system',
  id: 'ebook-1',
  seo_description: '디자인 시스템 구축을 위한 실전 가이드입니다.',
  slug: 'design-system-guide',
  status: 'published',
  title: '디자인 시스템 구축을 위한 실전 가이드북',
}

test('new E-book forms start empty', () => {
  assert.deepEqual(createInitialEbookForm(), {
    embedUrl: '',
    seoDescription: '',
    slug: '',
    title: '',
  })
})

test('E-book URL and slug validation accept only supported public formats', () => {
  assert.equal(isValidEbookUrl('https://example.com/book'), true)
  assert.equal(isValidEbookUrl('http://localhost:4173/book'), true)
  assert.equal(isValidEbookUrl('https://example.com/한글'), false)
  assert.equal(isValidEbookUrl('https://예시.com/book'), false)
  assert.equal(isValidEbookUrl('javascript:alert(1)'), false)
  assert.equal(isValidEbookUrl('not-a-url'), false)
  assert.equal(isValidEbookSlug('design-system-guide'), true)
  assert.equal(isValidEbookSlug('Design System'), false)
  assert.equal(
    sanitizeEbookEmbedUrl('https://example.com/한글?name=guide✅'),
    'https://example.com/?name=guide',
  )
  assert.equal(sanitizeEbookSlug('Design가이드-01'), 'design-01')
  assert.throws(
    () => normalizeEbookEmbedUrl('https://example.com/한글'),
    /지원하지 않는 E-book URL입니다/,
  )
  assert.equal(
    normalizeEbookEmbedUrl(' http://my.ebook36524.com/books/vzqq/ '),
    'https://my.ebook36524.com/books/vzqq/',
  )
  assert.equal(
    createEbookPublicUrl('fluonics', 'https://ebook.cbrain.kr'),
    'https://ebook.cbrain.kr/fluonics',
  )
  assert.equal(
    createEbookPreviewUrl('fluonics', 'http://localhost:3000'),
    'http://localhost:3000/ebook-preview/fluonics',
  )
})

test('E-book rows map to list and form values', () => {
  assert.deepEqual(
    toEbookListRow(ebook, 'https://ebook.cbrain.kr', 'http://localhost:3000'),
    {
      createdAt: '26. 03. 16',
      detailHref: '/ebook/ebook-1',
      id: 'ebook-1',
      previewUrl: 'http://localhost:3000/ebook-preview/design-system-guide',
      publicUrl: 'https://ebook.cbrain.kr/design-system-guide',
      status: 'published',
      title: '디자인 시스템 구축을 위한 실전 가이드북',
    },
  )

  assert.deepEqual(toEbookFormState(ebook), {
    embedUrl: 'https://example.com/ebooks/design-system',
    seoDescription: '디자인 시스템 구축을 위한 실전 가이드입니다.',
    slug: 'design-system-guide',
    title: '디자인 시스템 구축을 위한 실전 가이드북',
  })
})

test('E-book form maps to a published E-book mutation and upgrades HTTP', () => {
  assert.deepEqual(
    toEbookMutationInput(
      {
        embedUrl: ' http://my.ebook36524.com/books/vzqq/ ',
        seoDescription: ' 실전 가이드 ',
        slug: ' design-system-guide ',
        title: ' 디자인 시스템 가이드 ',
      },
    ),
    {
      embed_url: 'https://my.ebook36524.com/books/vzqq/',
      seo_description: '실전 가이드',
      slug: 'design-system-guide',
      status: 'published',
      title: '디자인 시스템 가이드',
    },
  )
})

test('E-book mutation rejects invalid required values', () => {
  assert.throws(
    () =>
      toEbookMutationInput({
        embedUrl: 'javascript:alert(1)',
        seoDescription: '',
        slug: 'Invalid Slug',
        title: '',
      }),
    /E-book 정보를 확인해주세요/,
  )
})
