import type { CatalogSticker } from '../../types/database'

export function sortStickerIds(ids: string[], catalog: Map<string, CatalogSticker>): string[] {
  return [...ids].sort((a, b) => {
    const ca = catalog.get(a)
    const cb = catalog.get(b)
    if (!ca || !cb) return 0
    if (ca.team_code !== cb.team_code) return ca.team_code.localeCompare(cb.team_code)
    return ca.number - cb.number
  })
}
