export const SECTIONS = [
  // ── CONMEBOL ─────────────────────────────────────────────────────────────
  { code: 'ARG', name: 'Argentina',     flag: '🇦🇷', type: 'team', conf: 'CONMEBOL', count: 18 },
  { code: 'BRA', name: 'Brazil',        flag: '🇧🇷', type: 'team', conf: 'CONMEBOL', count: 18 },
  { code: 'COL', name: 'Colombia',      flag: '🇨🇴', type: 'team', conf: 'CONMEBOL', count: 18 },
  { code: 'URU', name: 'Uruguay',       flag: '🇺🇾', type: 'team', conf: 'CONMEBOL', count: 18 },
  { code: 'ECU', name: 'Ecuador',       flag: '🇪🇨', type: 'team', conf: 'CONMEBOL', count: 18 },
  { code: 'PAR', name: 'Paraguay',      flag: '🇵🇾', type: 'team', conf: 'CONMEBOL', count: 18 },

  // ── CONCACAF ──────────────────────────────────────────────────────────────
  { code: 'USA', name: 'United States', flag: '🇺🇸', type: 'team', conf: 'CONCACAF', count: 18 },
  { code: 'MEX', name: 'Mexico',        flag: '🇲🇽', type: 'team', conf: 'CONCACAF', count: 18 },
  { code: 'CAN', name: 'Canada',        flag: '🇨🇦', type: 'team', conf: 'CONCACAF', count: 18 },
  { code: 'PAN', name: 'Panama',        flag: '🇵🇦', type: 'team', conf: 'CONCACAF', count: 18 },
  { code: 'CRC', name: 'Costa Rica',    flag: '🇨🇷', type: 'team', conf: 'CONCACAF', count: 18 },
  { code: 'JAM', name: 'Jamaica',       flag: '🇯🇲', type: 'team', conf: 'CONCACAF', count: 18 },

  // ── UEFA ──────────────────────────────────────────────────────────────────
  { code: 'FRA', name: 'France',        flag: '🇫🇷', type: 'team', conf: 'UEFA', count: 18 },
  { code: 'ENG', name: 'England',       flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', type: 'team', conf: 'UEFA', count: 18 },
  { code: 'ESP', name: 'Spain',         flag: '🇪🇸', type: 'team', conf: 'UEFA', count: 18 },
  { code: 'GER', name: 'Germany',       flag: '🇩🇪', type: 'team', conf: 'UEFA', count: 18 },
  { code: 'POR', name: 'Portugal',      flag: '🇵🇹', type: 'team', conf: 'UEFA', count: 18 },
  { code: 'NED', name: 'Netherlands',   flag: '🇳🇱', type: 'team', conf: 'UEFA', count: 18 },
  { code: 'BEL', name: 'Belgium',       flag: '🇧🇪', type: 'team', conf: 'UEFA', count: 18 },
  { code: 'ITA', name: 'Italy',         flag: '🇮🇹', type: 'team', conf: 'UEFA', count: 18 },
  { code: 'AUT', name: 'Austria',       flag: '🇦🇹', type: 'team', conf: 'UEFA', count: 18 },
  { code: 'SUI', name: 'Switzerland',   flag: '🇨🇭', type: 'team', conf: 'UEFA', count: 18 },
  { code: 'DEN', name: 'Denmark',       flag: '🇩🇰', type: 'team', conf: 'UEFA', count: 18 },
  { code: 'SCO', name: 'Scotland',      flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', type: 'team', conf: 'UEFA', count: 18 },
  { code: 'SRB', name: 'Serbia',        flag: '🇷🇸', type: 'team', conf: 'UEFA', count: 18 },
  { code: 'SVK', name: 'Slovakia',      flag: '🇸🇰', type: 'team', conf: 'UEFA', count: 18 },
  { code: 'CRO', name: 'Croatia',       flag: '🇭🇷', type: 'team', conf: 'UEFA', count: 18 },
  { code: 'HUN', name: 'Hungary',       flag: '🇭🇺', type: 'team', conf: 'UEFA', count: 18 },

  // ── CAF ───────────────────────────────────────────────────────────────────
  { code: 'MAR', name: 'Morocco',       flag: '🇲🇦', type: 'team', conf: 'CAF', count: 18 },
  { code: 'EGY', name: 'Egypt',         flag: '🇪🇬', type: 'team', conf: 'CAF', count: 18 },
  { code: 'SEN', name: 'Senegal',       flag: '🇸🇳', type: 'team', conf: 'CAF', count: 18 },
  { code: 'CMR', name: 'Cameroon',      flag: '🇨🇲', type: 'team', conf: 'CAF', count: 18 },
  { code: 'CIV', name: "Côte d'Ivoire", flag: '🇨🇮', type: 'team', conf: 'CAF', count: 18 },
  { code: 'TUN', name: 'Tunisia',       flag: '🇹🇳', type: 'team', conf: 'CAF', count: 18 },
  { code: 'GHA', name: 'Ghana',         flag: '🇬🇭', type: 'team', conf: 'CAF', count: 18 },
  { code: 'NGA', name: 'Nigeria',       flag: '🇳🇬', type: 'team', conf: 'CAF', count: 18 },
  { code: 'COD', name: 'DR Congo',      flag: '🇨🇩', type: 'team', conf: 'CAF', count: 18 },

  // ── AFC ───────────────────────────────────────────────────────────────────
  { code: 'JPN', name: 'Japan',         flag: '🇯🇵', type: 'team', conf: 'AFC', count: 18 },
  { code: 'KOR', name: 'South Korea',   flag: '🇰🇷', type: 'team', conf: 'AFC', count: 18 },
  { code: 'IRN', name: 'Iran',          flag: '🇮🇷', type: 'team', conf: 'AFC', count: 18 },
  { code: 'AUS', name: 'Australia',     flag: '🇦🇺', type: 'team', conf: 'AFC', count: 18 },
  { code: 'SAU', name: 'Saudi Arabia',  flag: '🇸🇦', type: 'team', conf: 'AFC', count: 18 },
  { code: 'QAT', name: 'Qatar',         flag: '🇶🇦', type: 'team', conf: 'AFC', count: 18 },
  { code: 'UZB', name: 'Uzbekistan',    flag: '🇺🇿', type: 'team', conf: 'AFC', count: 18 },
  { code: 'IRQ', name: 'Iraq',          flag: '🇮🇶', type: 'team', conf: 'AFC', count: 18 },

  // ── OFC ───────────────────────────────────────────────────────────────────
  { code: 'NZL', name: 'New Zealand',   flag: '🇳🇿', type: 'team', conf: 'OFC', count: 18 },

  // ── Playoffs (TBD) ────────────────────────────────────────────────────────
  { code: 'PL1', name: 'Playoff 1',     flag: '🏳️', type: 'team', conf: 'PLAYOFF', count: 18 },
  { code: 'PL2', name: 'Playoff 2',     flag: '🏳️', type: 'team', conf: 'PLAYOFF', count: 18 },
  { code: 'PL3', name: 'Playoff 3',     flag: '🏳️', type: 'team', conf: 'PLAYOFF', count: 18 },

  // ── Special sections ──────────────────────────────────────────────────────
  { code: 'STD', name: 'Stadiums',      flag: '🏟️', type: 'special', conf: 'SPECIAL', count: 20 },
  { code: 'SPC', name: 'Specials',      flag: '✨',  type: 'special', conf: 'SPECIAL', count: 20 },
]

export const CONF_ORDER = ['CONMEBOL', 'CONCACAF', 'UEFA', 'CAF', 'AFC', 'OFC', 'PLAYOFF', 'SPECIAL']

export const CONF_LABELS = {
  CONMEBOL: 'South America',
  CONCACAF: 'N/C America',
  UEFA:     'Europe',
  CAF:      'Africa',
  AFC:      'Asia',
  OFC:      'Oceania',
  PLAYOFF:  'Playoffs',
  SPECIAL:  'Special'
}

// Teams ordered as they appear in the Qatar 2022 Panini album (by group),
// followed by 2026 qualifiers that weren't in that edition, then specials.
export const ALBUM_ORDER = [
  // Group A
  'QAT', 'ECU', 'SEN', 'NED',
  // Group B (Wales didn't qualify for 2026)
  'ENG', 'IRN', 'USA',
  // Group C (Poland didn't qualify for 2026)
  'ARG', 'SAU', 'MEX',
  // Group D
  'FRA', 'AUS', 'DEN', 'TUN',
  // Group E
  'ESP', 'CRC', 'GER', 'JPN',
  // Group F
  'BEL', 'CAN', 'MAR', 'CRO',
  // Group G
  'BRA', 'SRB', 'SUI', 'CMR',
  // Group H
  'POR', 'GHA', 'URU', 'KOR',
  // 2026 qualifiers not present in Qatar 2022
  'COL', 'PAR', 'PAN', 'JAM',
  'ITA', 'AUT', 'SCO', 'SVK', 'HUN',
  'EGY', 'CIV', 'NGA', 'COD',
  'UZB', 'IRQ', 'NZL',
  // Playoffs (TBD)
  'PL1', 'PL2', 'PL3',
  // Special sections
  'STD', 'SPC',
]

export function buildStickerRows() {
  const rows = []
  for (const section of SECTIONS) {
    for (let n = 1; n <= section.count; n++) {
      rows.push({
        id: `${section.code}-${String(n).padStart(2, '0')}`,
        teamCode: section.code,
        number: n,
        quantity: 0
      })
    }
  }
  return rows
}
