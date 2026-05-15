export type Resolution = { owned: number; total: number }

export function resolveAlbumTotal(
  requiredQty: number | 'all',
  albumCollected: number,
): Resolution {
  // 'all' makes no sense here — albumTotal challenges always specify a numeric target.
  const total = typeof requiredQty === 'number' && requiredQty > 0 ? requiredQty : 0
  return { owned: Math.min(albumCollected, total), total }
}

export function resolveTeamCodes(
  teamCodes: string[],
  requiredQty: number | 'all',
  perTeam: boolean,
  byTeam: Map<string, string[]>,
  quantities: Map<string, number>,
): Resolution {
  if (perTeam) {
    const owned = teamCodes.filter(code => {
      const ids = byTeam.get(code) ?? []
      const collected = ids.filter(id => (quantities.get(id) ?? 0) >= 1).length
      if (requiredQty === 'all') return ids.length > 0 && collected === ids.length
      return collected >= (requiredQty as number)
    }).length
    return { owned, total: teamCodes.length }
  }

  const allIds = teamCodes.flatMap(code => byTeam.get(code) ?? [])
  const owned = allIds.filter(id => (quantities.get(id) ?? 0) >= 1).length
  const total = requiredQty === 'all' ? allIds.length : Math.min(requiredQty as number, allIds.length)
  return { owned: Math.min(owned, total), total }
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
