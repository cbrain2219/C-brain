export type PublicAssetPathOptions = {
  readonly preserveOriginalFileName?: boolean
}

function getFileExtension(fileName: string) {
  return fileName.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin'
}

export function createPublicAssetPath(
  scope: string,
  fileName: string,
  options: PublicAssetPathOptions = {},
) {
  const assetId = crypto.randomUUID()

  return options.preserveOriginalFileName
    ? `${scope}/${assetId}/${fileName}`
    : `${scope}/${assetId}.${getFileExtension(fileName)}`
}
