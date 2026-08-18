import { describe, expect, it, vi } from 'vitest'
import type { ManagedContentValue } from '@repo/content/types'
import { validateManagedContentForPublish } from './managedContentPublishValidation'

const value = (document: ManagedContentValue['contentJson']): ManagedContentValue => ({
  content: '<p>본문</p>',
  contentAssetScope: '00000000-0000-4000-8000-000000000001',
  contentAuthoringMode: 'wysiwyg',
  contentJson: document,
  contentMode: 'html',
  contentSchemaVersion: 1,
  contentSourceBackup: null,
})

const owned = 'https://project.supabase.co/storage/v1/object/public/public-assets/content/blog/00000000-0000-4000-8000-000000000001/images/00000000-0000-4000-8000-000000000099.png'

describe('managed content publish validation', () => {
  it('rejects pending registry work before serializable document inspection', () => {
    const isOwnedUrl = vi.fn(() => true)
    expect(validateManagedContentForPublish(value({ type: 'doc' }), { pendingAssetCount: 1, isOwnedUrl })).toBe('pending_upload')
    expect(isOwnedUrl).not.toHaveBeenCalled()
  })

  it('recursively validates pending image attributes, alt review, decorative state, and exact ownership', () => {
    const nestedImage = (attrs: Record<string, unknown>) => ({
      type: 'doc' as const,
      content: [{ type: 'blockquote', content: [{ type: 'paragraph', content: [{ type: 'image', attrs }] }] }],
    })
    const context = { pendingAssetCount: 0, isOwnedUrl: (url: string) => url === owned }
    expect(validateManagedContentForPublish(value(nestedImage({ src: owned, uploadId: 'still-uploading' })), context)).toBe('pending_upload')
    expect(validateManagedContentForPublish(value(nestedImage({ alt: '설명', altReviewed: false, decorative: false, src: owned })), context)).toBe('alt_review_required')
    expect(validateManagedContentForPublish(value(nestedImage({ alt: '', altReviewed: true, decorative: false, src: owned })), context)).toBe('nondecorative_alt_required')
    expect(validateManagedContentForPublish(value(nestedImage({ alt: '장식', altReviewed: true, decorative: true, src: owned })), context)).toBe('decorative_alt_must_be_empty')
    expect(validateManagedContentForPublish(value(nestedImage({ alt: '설명', altReviewed: true, decorative: false, src: 'https://attacker.example/image.png' })), context)).toBe('invalid_image_url')
    expect(validateManagedContentForPublish(value(nestedImage({ alt: '', altReviewed: true, decorative: true, src: owned })), context)).toBeNull()
  })

  it('fails closed on malformed transient/accessibility attributes', () => {
    const image = (attrs: Record<string, unknown>) => value({ type: 'doc', content: [{ type: 'image', attrs }] })
    const context = { pendingAssetCount: 0, isOwnedUrl: () => true }
    for (const uploadId of ['', 0, false, {}]) {
      expect(validateManagedContentForPublish(image({ alt: '설명', altReviewed: true, decorative: false, src: owned, uploadId }), context)).toBe('pending_upload')
    }
    expect(validateManagedContentForPublish(image({ alt: '설명', altReviewed: true, decorative: 'false', src: owned }), context)).toBe('invalid_image_url')
    expect(validateManagedContentForPublish(image({ alt: null, altReviewed: true, decorative: false, src: owned }), context)).toBe('invalid_image_url')
    expect(validateManagedContentForPublish(image({ alt: '설명', altReviewed: true, decorative: false, src: 12 }), context)).toBe('invalid_image_url')
    expect(validateManagedContentForPublish(image({ alt: '설명', altReviewed: 'yes', decorative: false, src: owned }), context)).toBe('alt_review_required')
  })

  it('returns the first failing image in document order', () => {
    const invalidAlt = { type: 'image', attrs: { alt: '', altReviewed: true, decorative: false, src: owned } }
    const pending = { type: 'image', attrs: { alt: '설명', altReviewed: true, decorative: false, src: owned, uploadId: 'pending' } }
    const context = { pendingAssetCount: 0, isOwnedUrl: () => true }
    expect(validateManagedContentForPublish(value({ type: 'doc', content: [invalidAlt, pending] }), context)).toBe('nondecorative_alt_required')
    expect(validateManagedContentForPublish(value({ type: 'doc', content: [pending, invalidAlt] }), context)).toBe('pending_upload')
  })

  it('does not impose WYSIWYG publication requirements on raw content', () => {
    expect(validateManagedContentForPublish({ ...value({ type: 'doc', content: [{ type: 'image', attrs: { src: 'blob:pending', uploadId: 'x' } }] }), contentAuthoringMode: 'raw_html' }, {
      pendingAssetCount: 0,
      isOwnedUrl: () => false,
    })).toBeNull()
  })
})
