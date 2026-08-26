import {
  STORAGE_BUCKETS,
  deleteFiles,
  getPublicFileUrl,
  uploadFile,
} from '@repo/supabase'
import { createPublicAssetPath } from './publicAssetPath'
import { supabase } from './supabase'

function getFileExtension(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '')

  return extension || 'bin'
}

const assetContentTypes: Readonly<Record<string, string>> = {
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  mov: 'video/quicktime',
  mp4: 'video/mp4',
  png: 'image/png',
  webp: 'image/webp',
}

export async function uploadPublicAsset(scope: string, file: File) {
  const path = createPublicAssetPath(scope, file.name)

  await uploadFile(supabase, STORAGE_BUCKETS.publicAssets, path, file, {
    cacheControl: '31536000',
    contentType: file.type || assetContentTypes[getFileExtension(file)],
  })

  return path
}

export function getPublicAssetUrl(path: string | null) {
  return path
    ? getPublicFileUrl(supabase, STORAGE_BUCKETS.publicAssets, path)
    : null
}

export async function deletePublicAssets(paths: readonly (string | null | undefined)[]) {
  const uniquePaths = [...new Set(paths.filter((path): path is string => Boolean(path)))]

  if (uniquePaths.length === 0) return

  await deleteFiles(supabase, STORAGE_BUCKETS.publicAssets, uniquePaths)
}
