import { useLayoutEffect, useMemo, useRef, useState } from 'react'

export type ManagedContentEditorState = {
  readonly busy: boolean
  readonly onBusyChange: (busy: boolean) => void
  readonly onPendingAssetCountChange: (count: number) => void
  readonly pendingAssetCount: number
}

function normalizePendingAssetCount(count: number): number {
  return Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0
}

/** Keeps action state scoped to the record currently visible in its parent. */
export function useManagedContentEditorState(
  documentKey: string,
  startsBusy = false,
): ManagedContentEditorState {
  const [visit, setVisit] = useState(0)
  const activeDocumentKey = useRef({ active: true, documentKey, token: 0, visit })
  const [state, setState] = useState({
    busy: startsBusy,
    generation: documentKey,
    pendingAssetCount: 0,
    visit,
  })
  const isCurrentGeneration = state.generation === documentKey && state.visit === visit

  useLayoutEffect(() => {
    const previous = activeDocumentKey.current
    const currentVisit = previous.documentKey === documentKey ? visit : previous.visit + 1
    const token = previous.token + 1
    const committed = { active: true, documentKey, token, visit: currentVisit }

    activeDocumentKey.current = committed
    if (currentVisit !== visit) setVisit(currentVisit)

    return () => {
      if (activeDocumentKey.current.token === token) {
        activeDocumentKey.current = { ...committed, active: false }
      }
    }
  }, [documentKey, visit])

  return useMemo(
    () => ({
      busy: isCurrentGeneration ? state.busy : startsBusy,
      onBusyChange: (nextBusy: boolean) => {
        const committed = activeDocumentKey.current
        if (!committed.active || committed.documentKey !== documentKey || committed.visit !== visit) return
        setState((current) => ({
          busy: Boolean(nextBusy),
          generation: documentKey,
          pendingAssetCount:
            current.generation === documentKey && current.visit === visit ? current.pendingAssetCount : 0,
          visit,
        }))
      },
      onPendingAssetCountChange: (count: number) => {
        const committed = activeDocumentKey.current
        if (!committed.active || committed.documentKey !== documentKey || committed.visit !== visit) return
        setState((current) => ({
          busy: current.generation === documentKey && current.visit === visit ? current.busy : startsBusy,
          generation: documentKey,
          pendingAssetCount: normalizePendingAssetCount(count),
          visit,
        }))
      },
      pendingAssetCount: isCurrentGeneration ? state.pendingAssetCount : 0,
    }),
    [documentKey, isCurrentGeneration, startsBusy, state, visit],
  )
}
