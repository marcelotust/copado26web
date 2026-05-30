export type ChallengeDifficulty = 'easy' | 'medium' | 'hard' | 'legendary'

export type Challenge = {
  id: string
  icon: string
  difficulty: ChallengeDifficulty
  // --- target resolution (pick exactly one) ---
  /** Counts collected stickers across the entire album */
  albumTotal?: true
  /** All stickers from one team */
  teamCode?: string
  /** Explicit list of teams (use with perTeam for “one per nation” style goals) */
  teamCodes?: string[]
  /** All stickers from all teams in a group (uses Team.group_letter) */
  groupLetter?: string
  /** Explicit list of sticker IDs */
  targetIds?: string[]
  /** All teams whose conf is in this list — combined with perTeam */
  confs?: string[]
  /** Each inner array = one "continent slot"; user needs ≥1 sticker from ≥1 team in each slot */
  confGroups?: string[][]
  // --- completion condition ---
  requiredQty: number | 'all'
  /** When true, requiredQty must be satisfied per team individually (owned = # of qualifying teams) */
  perTeam?: boolean
}
