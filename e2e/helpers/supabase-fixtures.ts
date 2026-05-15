/** Minimal catalog rows for public E2E when Supabase is stubbed. */
export const MOCK_TEAMS = [
  {
    code: 'BRA',
    name_key: 'teams.bra',
    flag: '🇧🇷',
    conf: 'CONMEBOL',
    group_letter: 'D',
    sort_order: 1,
  },
] as const

export const MOCK_STICKERS = [
  {
    id: 'bra-1',
    team_code: 'BRA',
    number: 1,
    player_name: 'E2E Player',
    is_special: false,
    sort_order: 1,
  },
] as const
