export type Resolution = { owned: number; total: number }

export function resolveAlbumTotal(
  requiredQty: number,
  albumCollected: number,
): Resolution {
  const total = requiredQty
  return { owned: Math.min(albumCollected, total), total }
}

export function resolveTeamCode(
  teamCode: string,
  requiredQty: number | 'all',
  byTeam: Map<string, string[]>,
  quantities: Map<string, number>,
): Resolution {
  const ids = byTeam.get(teamCode) ?? []
  const owned = ids.filter(id => (quantities.get(id) ?? 0) >= 1).length
  const total = requiredQty === 'all' ? ids.length : Math.min(requiredQty, ids.length)
  return { owned: Math.min(owned, total), total }
}

export function resolveTargetIds(
  targetIds: string[],
  requiredQty: number | 'all',
  quantities: Map<string, number>,
): Resolution {
  const owned = targetIds.filter(id => (quantities.get(id) ?? 0) >= 1).length
  const total = requiredQty === 'all' ? targetIds.length : (requiredQty as number)
  return { owned: Math.min(owned, total), total }
}
