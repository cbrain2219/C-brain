import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createEbookPublicUrl,
  createInitialEbookForm,
  getEbookOgImageDisplayName,
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
  og_image_alt: '디자인 시스템 가이드 OG 이미지',
  og_image_file_name: 'design-system-og.webp',
  og_image_path: 'ebook-og-images/00000000-0000-4000-8000-000000000001.webp',
  seo_description: '디자인 시스템 구축을 위한 실전 가이드입니다.',
  slug: 'design-system-guide',
  status: 'published',
  title: '디자인 시스템 구축을 위한 실전 가이드북',
}

test('new E-book forms start empty', () => {
  assert.deepEqual(createInitialEbookForm(), {
    embedUrl: '',
    ogImage: null,
    ogImageAlt: '',
    ogImageFileName: null,
    ogImagePath: null,
    ogImagePreviewUrl: null,
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
    createEbookPublicUrl('fluonics', 'https://www.cbrain.kr'),
    'https://www.cbrain.kr/ebook/fluonics',
  )
})

test('E-book rows map to list and form values', () => {
  assert.deepEqual(
    toEbookListRow(ebook, 'https://www.cbrain.kr'),
    {
      createdAt: '26. 03. 16',
      detailHref: '/ebook/ebook-1',
      id: 'ebook-1',
      publicUrl: 'https://www.cbrain.kr/ebook/design-system-guide',
      status: 'published',
      title: '디자인 시스템 구축을 위한 실전 가이드북',
    },
  )

  assert.deepEqual(toEbookFormState(ebook, 'https://assets.example/og.webp'), {
    embedUrl: 'https://example.com/ebooks/design-system',
    ogImage: null,
    ogImageAlt: '디자인 시스템 가이드 OG 이미지',
    ogImageFileName: 'design-system-og.webp',
    ogImagePath: 'ebook-og-images/00000000-0000-4000-8000-000000000001.webp',
    ogImagePreviewUrl: 'https://assets.example/og.webp',
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
        ogImage: null,
        ogImageAlt: '',
        ogImageFileName: 'guide-og.webp',
        ogImagePath: null,
        ogImagePreviewUrl: null,
        seoDescription: ' 실전 가이드 ',
        slug: ' design-system-guide ',
        title: ' 디자인 시스템 가이드 ',
      },
      'published',
      'ebook-og-images/00000000-0000-4000-8000-000000000001.webp',
    ),
    {
      embed_url: 'https://my.ebook36524.com/books/vzqq/',
      og_image_alt: '디자인 시스템 가이드',
      og_image_file_name: 'guide-og.webp',
      og_image_path:
        'ebook-og-images/00000000-0000-4000-8000-000000000001.webp',
      seo_description: '실전 가이드',
      slug: 'design-system-guide',
      status: 'published',
      title: '디자인 시스템 가이드',
    },
  )
})

test('E-book OG image display name prefers a new file and keeps stored metadata', () => {
  assert.equal(
    getEbookOgImageDisplayName({
      ogImage: { name: 'new-og.png' },
      ogImageFileName: 'stored-og.webp',
    }),
    'new-og.png',
  )
  assert.equal(
    getEbookOgImageDisplayName({
      ogImage: null,
      ogImageFileName: 'stored-og.webp',
    }),
    'stored-og.webp',
  )
})

test('E-book mutation rejects invalid required values', () => {
  assert.throws(
    () =>
      toEbookMutationInput({
        embedUrl: 'javascript:alert(1)',
        ogImage: null,
        ogImageAlt: '',
        ogImageFileName: null,
        ogImagePath: null,
        ogImagePreviewUrl: null,
        seoDescription: '',
        slug: 'Invalid Slug',
        title: '',
      }),
    /E-book 정보를 확인해주세요/,
  )
})
