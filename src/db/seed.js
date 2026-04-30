// ── Player maps: sticker number → player name (positions 2-12 and 14-20 only)
// Position 1  = Shield (isSpecial)
// Position 13 = Team Photo
// Positions 2-12, 14-20 = Players

/** @type {Record<number, string>} */
const BRA_PLAYERS = {
  2:  'Alisson',
  3:  'Bento',
  4:  'Marquinhos',
  5:  'Militão',
  6:  'Gabriel Magalhães',
  7:  'Danilo',
  8:  'Wesley',
  9:  'Casemiro',
  10: 'Paquetá',
  11: 'Bruno Guimarães',
  12: 'Luiz Henrique',
  14: 'Vini Jr',
  15: 'Rodrygo',
  16: 'João Pedro',
  17: 'Matheus Cunha',
  18: 'Martinelli',
  19: 'Raphinha',
  20: 'Estêvão',
}

/** @type {Record<number, string>} */
const MEX_PLAYERS = {
  12: 'Marcel Ruiz',
  14: 'Érick Sánchez',
  15: 'Hirving Lozano',
  16: 'Santiago Giménez',
  17: 'Raúl Jiménez',
  18: 'Alexis Vega',
  19: 'Roberto Alvarado',
  20: 'Cesar Huerta',
}

/** @type {Record<number, string>} */
const CAN_PLAYERS = {
  3:  'Alphonso Davies',
  10: 'Stephen Eustáquio',
  19: 'Cyle Larin',
  20: 'Jonathan David',
}

const RSA_PLAYERS = {
  2:  'Ronwen Williams',
  8:  'Siyabonga Ngezana',
  11: 'Teboho Mokoena',
  17: 'Lyle Foster',
}

// ── Sections ──────────────────────────────────────────────────────────────────
// Each team: 20 stickers (1=Shield isSpecial, 13=Team Photo, 2-12/14-20=Players)
// FWC special: 20 stickers (00-19), startNumber=0, no shield/teamPhoto logic

export const SECTIONS = [
  // ── Opening pages ─────────────────────────────────────────────────────────
  { code: 'FWC', name: 'FIFA World Cup',  flag: '🏆', type: 'special',
    conf: 'FWC', group: 'FWC', count: 20, startNumber: 0 },

  // ── Group A ───────────────────────────────────────────────────────────────
  { code: 'USA', name: 'United States', flag: '🇺🇸', type: 'team', conf: 'CONCACAF', group: 'A', count: 20 },
  { code: 'PAN', name: 'Panama',        flag: '🇵🇦', type: 'team', conf: 'CONCACAF', group: 'A', count: 20 },
  { code: 'MAR', name: 'Morocco',       flag: '🇲🇦', type: 'team', conf: 'CAF',      group: 'A', count: 20 },
  { code: 'JPN', name: 'Japan',         flag: '🇯🇵', type: 'team', conf: 'AFC',      group: 'A', count: 20 },

  // ── Group B ───────────────────────────────────────────────────────────────
  { code: 'MEX', name: 'Mexico',        flag: '🇲🇽', type: 'team', conf: 'CONCACAF', group: 'B', count: 20,
    players: MEX_PLAYERS },
  { code: 'JAM', name: 'Jamaica',       flag: '🇯🇲', type: 'team', conf: 'CONCACAF', group: 'B', count: 20 },
  { code: 'EGY', name: 'Egypt',         flag: '🇪🇬', type: 'team', conf: 'CAF',      group: 'B', count: 20 },
  { code: 'AUS', name: 'Australia',     flag: '🇦🇺', type: 'team', conf: 'AFC',      group: 'B', count: 20 },

  // ── Group C ───────────────────────────────────────────────────────────────
  { code: 'CAN', name: 'Canada',        flag: '🇨🇦', type: 'team', conf: 'CONCACAF', group: 'C', count: 20,
    players: CAN_PLAYERS },
  { code: 'CRC', name: 'Costa Rica',    flag: '🇨🇷', type: 'team', conf: 'CONCACAF', group: 'C', count: 20 },
  { code: 'COD', name: 'DR Congo',      flag: '🇨🇩', type: 'team', conf: 'CAF',      group: 'C', count: 20 },
  { code: 'NZL', name: 'New Zealand',   flag: '🇳🇿', type: 'team', conf: 'OFC',      group: 'C', count: 20 },

  // ── Group D ───────────────────────────────────────────────────────────────
  { code: 'ARG', name: 'Argentina',     flag: '🇦🇷', type: 'team', conf: 'CONMEBOL', group: 'D', count: 20 },
  { code: 'SUI', name: 'Switzerland',   flag: '🇨🇭', type: 'team', conf: 'UEFA',     group: 'D', count: 20 },
  { code: 'SEN', name: 'Senegal',       flag: '🇸🇳', type: 'team', conf: 'CAF',      group: 'D', count: 20 },
  { code: 'KOR', name: 'South Korea',   flag: '🇰🇷', type: 'team', conf: 'AFC',      group: 'D', count: 20 },

  // ── Group E ───────────────────────────────────────────────────────────────
  { code: 'BRA', name: 'Brazil',        flag: '🇧🇷', type: 'team', conf: 'CONMEBOL', group: 'E', count: 20,
    players: BRA_PLAYERS },
  { code: 'HUN', name: 'Hungary',       flag: '🇭🇺', type: 'team', conf: 'UEFA',     group: 'E', count: 20 },
  { code: 'NGA', name: 'Nigeria',       flag: '🇳🇬', type: 'team', conf: 'CAF',      group: 'E', count: 20 },
  { code: 'IRN', name: 'Iran',          flag: '🇮🇷', type: 'team', conf: 'AFC',      group: 'E', count: 20 },

  // ── Group F ───────────────────────────────────────────────────────────────
  { code: 'COL', name: 'Colombia',      flag: '🇨🇴', type: 'team', conf: 'CONMEBOL', group: 'F', count: 20 },
  { code: 'CRO', name: 'Croatia',       flag: '🇭🇷', type: 'team', conf: 'UEFA',     group: 'F', count: 20 },
  { code: 'CMR', name: 'Cameroon',      flag: '🇨🇲', type: 'team', conf: 'CAF',      group: 'F', count: 20 },
  { code: 'SAU', name: 'Saudi Arabia',  flag: '🇸🇦', type: 'team', conf: 'AFC',      group: 'F', count: 20 },

  // ── Group G ───────────────────────────────────────────────────────────────
  { code: 'URU', name: 'Uruguay',       flag: '🇺🇾', type: 'team', conf: 'CONMEBOL', group: 'G', count: 20 },
  { code: 'SVK', name: 'Slovakia',      flag: '🇸🇰', type: 'team', conf: 'UEFA',     group: 'G', count: 20 },
  { code: 'CIV', name: "Côte d'Ivoire", flag: '🇨🇮', type: 'team', conf: 'CAF',      group: 'G', count: 20 },
  { code: 'QAT', name: 'Qatar',         flag: '🇶🇦', type: 'team', conf: 'AFC',      group: 'G', count: 20 },

  // ── Group H ───────────────────────────────────────────────────────────────
  { code: 'ECU', name: 'Ecuador',       flag: '🇪🇨', type: 'team', conf: 'CONMEBOL', group: 'H', count: 20 },
  { code: 'SRB', name: 'Serbia',        flag: '🇷🇸', type: 'team', conf: 'UEFA',     group: 'H', count: 20 },
  { code: 'GHA', name: 'Ghana',         flag: '🇬🇭', type: 'team', conf: 'CAF',      group: 'H', count: 20 },
  { code: 'UZB', name: 'Uzbekistan',    flag: '🇺🇿', type: 'team', conf: 'AFC',      group: 'H', count: 20 },

  // ── Group I ───────────────────────────────────────────────────────────────
  { code: 'PAR', name: 'Paraguay',      flag: '🇵🇾', type: 'team', conf: 'CONMEBOL', group: 'I', count: 20 },
  { code: 'DEN', name: 'Denmark',       flag: '🇩🇰', type: 'team', conf: 'UEFA',     group: 'I', count: 20 },
  { code: 'TUN', name: 'Tunisia',       flag: '🇹🇳', type: 'team', conf: 'CAF',      group: 'I', count: 20 },
  { code: 'IRQ', name: 'Iraq',          flag: '🇮🇶', type: 'team', conf: 'AFC',      group: 'I', count: 20 },

  // ── Group J ───────────────────────────────────────────────────────────────
  { code: 'ESP', name: 'Spain',         flag: '🇪🇸', type: 'team', conf: 'UEFA',     group: 'J', count: 20 },
  { code: 'FRA', name: 'France',        flag: '🇫🇷', type: 'team', conf: 'UEFA',     group: 'J', count: 20 },
  { code: 'SCO', name: 'Scotland',      flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', type: 'team', conf: 'UEFA',     group: 'J', count: 20 },
  { code: 'PL1', name: 'Playoff 1',     flag: '🏳️', type: 'team', conf: 'PLAYOFF',  group: 'J', count: 20 },

  // ── Group K ───────────────────────────────────────────────────────────────
  { code: 'GER', name: 'Germany',       flag: '🇩🇪', type: 'team', conf: 'UEFA',     group: 'K', count: 20 },
  { code: 'ITA', name: 'Italy',         flag: '🇮🇹', type: 'team', conf: 'UEFA',     group: 'K', count: 20 },
  { code: 'AUT', name: 'Austria',       flag: '🇦🇹', type: 'team', conf: 'UEFA',     group: 'K', count: 20 },
  { code: 'PL2', name: 'Playoff 2',     flag: '🏳️', type: 'team', conf: 'PLAYOFF',  group: 'K', count: 20 },

  // ── Group L ───────────────────────────────────────────────────────────────
  { code: 'POR', name: 'Portugal',      flag: '🇵🇹', type: 'team', conf: 'UEFA',     group: 'L', count: 20 },
  { code: 'ENG', name: 'England',       flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', type: 'team', conf: 'UEFA',     group: 'L', count: 20 },
  { code: 'NED', name: 'Netherlands',   flag: '🇳🇱', type: 'team', conf: 'UEFA',     group: 'L', count: 20 },
  { code: 'BEL', name: 'Belgium',       flag: '🇧🇪', type: 'team', conf: 'UEFA',     group: 'L', count: 20 },
]

// Ordered for sidebar display: FWC intro first, then groups A-L
export const GROUP_ORDER = ['FWC', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

// Kept for StickerGrid confederation label lookups
export const CONF_ORDER = ['CONMEBOL', 'CONCACAF', 'UEFA', 'CAF', 'AFC', 'OFC', 'PLAYOFF', 'FWC']

export const CONF_LABELS = {
  CONMEBOL: 'South America',
  CONCACAF: 'N/C America',
  UEFA:     'Europe',
  CAF:      'Africa',
  AFC:      'Asia',
  OFC:      'Oceania',
  PLAYOFF:  'Playoffs',
  FWC:      'FIFA World Cup',
}

// ── Sticker row builder ───────────────────────────────────────────────────────
export function buildStickerRows() {
  const rows = []

  for (const section of SECTIONS) {
    const start = section.startNumber ?? 1
    const end   = start + section.count - 1
    const isTeam = section.type === 'team'

    for (let n = start; n <= end; n++) {
      let label = null
      if (isTeam) {
        if (n === 1)       label = 'Shield'
        else if (n === 13) label = 'Team Photo'
        else               label = section.players?.[n] ?? null
      }

      rows.push({
        id:        `${section.code}-${String(n).padStart(2, '0')}`,
        teamCode:  section.code,
        number:    n,
        quantity:  0,
        isSpecial: isTeam && n === 1,
        label,
      })
    }
  }

  return rows
}

export { RSA_PLAYERS }
