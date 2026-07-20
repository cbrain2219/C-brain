export const MAX_PORTFOLIO_IMAGE_BYTES = 50 * 1024 * 1024

const acceptedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

export type PortfolioUploadFile = Pick<File, 'size' | 'type'>

export function isValidPortfolioSlug(value: string) {
  return /^[A-Za-z-]+$/.test(value)
}

export function getPortfolioImageError(file: PortfolioUploadFile) {
  if (!acceptedImageTypes.has(file.type)) {
    return 'PNG, JPEG, WEBP 파일만 업로드할 수 있습니다.'
  }

  if (file.size > MAX_PORTFOLIO_IMAGE_BYTES) {
    return '이미지 파일은 최대 50MB까지 업로드할 수 있습니다.'
  }

  return null
}
