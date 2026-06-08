import type { CatalogSticker, Team } from '../../types/database'
import { pad } from '../../lib/shareText'
import { displayTeamCode } from '../../lib/stickerDisplay'

export type TeamStickerRow = { team: Team; numbers: number[] }
export type StickerGroup = { groupKey: string; rows: TeamStickerRow[] }

/** Groups sticker IDs by album section order (WAP → Grupo A…L → FWC/CC).
 *  Teams with no matching IDs are omitted. Numbers within each team are sorted ascending. */
export function groupStickerIds(
  ids: string[],
  catalog: Map<string, CatalogSticker>,
  teams: Team[],
): StickerGroup[] {
  const byTeam = new Map<string, number[]>()
  for (const id of ids) {
    const s = catalog.get(id)
    if (!s) continue
    const nums = byTeam.get(s.team_code) ?? []
    nums.push(s.number)
    byTeam.set(s.team_code, nums)
  }
  for (const nums of byTeam.values()) nums.sort((a, b) => a - b)

  const groups: StickerGroup[] = []
  for (const team of teams) {
    const numbers = byTeam.get(team.code)
    if (!numbers || numbers.length === 0) continue
    const key = team.group_letter ?? team.code
    const last = groups[groups.length - 1]
    if (last && last.groupKey === key) {
      last.rows.push({ team, numbers })
    } else {
      groups.push({ groupKey: key, rows: [{ team, numbers }] })
    }
  }
  return groups
}

/** Formats grouped sticker rows as a plain-text block for sharing. */
export function formatGroupedStickerText(
  groups: StickerGroup[],
  groupLabel: (key: string) => string,
): string {
  return groups
    .flatMap(({ groupKey, rows }) => [
      groupLabel(groupKey),
      ...rows.map(({ team, numbers }) =>
        `${team.flag} ${displayTeamCode(team.code)}: ${numbers.map(n => pad(n)).join(' · ')}`,
      ),
      '',
    ])
    .join('\n')
    .trim()
}
