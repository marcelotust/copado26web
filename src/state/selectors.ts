// Re-exports for the public selector surface. Individual hooks live in
// progressSelectors / collectionSelectors to keep each file <100 LOC.

export { useStickersStatus, useTeams, useTeam }                  from './progressSelectors'
export { useSectionProgress, useAlbumProgress }                  from './progressSelectors'
export { useSectionStickers, useSwaps, useMissing, useTradeIdLists, useSectionSwapCount } from './collectionSelectors'

import { useStickersContext } from './StickersProvider'
import type { ContextValue } from './stickersTypes'

export function useAdjustSticker() {
  return useStickersContext().adjust
}

export function useApplyTrade() {
  return useStickersContext().applyTrade
}

export function useResetAlbum() {
  return useStickersContext().resetAll
}

export function useReplaceAllQuantities() {
  return useStickersContext().replaceAllQuantities
}

export function useCatalogSnapshot(): ContextValue {
  return useStickersContext()
}
