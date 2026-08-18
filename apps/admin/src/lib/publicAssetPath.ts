function getFileExtension(fileName: string) {
  return fileName.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin'
}

export function createPublicAssetPath(scope: string, fileName: string) {
  return `${scope}/${crypto.randomUUID()}.${getFileExtension(fileName)}`
}
