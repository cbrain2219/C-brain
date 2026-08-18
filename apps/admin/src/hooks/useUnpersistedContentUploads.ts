import type { ContentEntity } from '@repo/content/types'
import { useEffect, useMemo } from 'react'
import { UnpersistedContentAssetTracker } from '../lib/unpersistedContentAssetTracker'

/** Owns one exact record body-image scope until its row is saved or abandoned. */
export function useUnpersistedContentUploads(entity: ContentEntity, assetScope: string) {
  const tracker = useMemo(
    () => new UnpersistedContentAssetTracker({ assetScope, entity }),
    [assetScope, entity],
  )

  useEffect(
    () => () => {
      void tracker.cleanup()
    },
    [tracker],
  )

  return useMemo(
    () => ({
      markPersisted: () => tracker.commit(),
      trackUploadedPath: (path: string) => tracker.track(path),
    }),
    [tracker],
  )
}
