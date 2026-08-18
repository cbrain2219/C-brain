import type { ContentEntity } from '@repo/content/types'
import { isContentImagePublicUrlOwnedBy } from '../../lib/contentAssetStorage'
import type { ManagedContentFormValue } from '../../lib/managedContent'
import {
  validateManagedContentForPublish,
  type ManagedContentPublishIssue,
} from '../../lib/managedContentPublishValidation'

const publishMessages: Record<ManagedContentPublishIssue, string> = {
  alt_review_required: '본문 이미지의 대체 텍스트를 검토한 뒤 게시할 수 있습니다.',
  decorative_alt_must_be_empty: '장식용 본문 이미지의 대체 텍스트는 비워주세요.',
  invalid_image_url: '본문 이미지의 저장 위치를 확인한 뒤 게시할 수 있습니다.',
  nondecorative_alt_required: '본문 이미지에 대체 텍스트를 입력한 뒤 게시할 수 있습니다.',
  pending_upload: '본문 이미지 업로드가 완료된 뒤 게시할 수 있습니다.',
}

export function getManagedContentPublishError(
  entity: ContentEntity,
  value: ManagedContentFormValue,
  pendingAssetCount: number,
): string | null {
  const issue = validateManagedContentForPublish(value, {
    isOwnedUrl: (url) => isContentImagePublicUrlOwnedBy(entity, value.contentAssetScope, url),
    pendingAssetCount,
  })
  return issue ? publishMessages[issue] : null
}
