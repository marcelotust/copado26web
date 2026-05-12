// ── Player maps: sticker number → player name
// Position 1  = Shield (isSpecial)
// Position 13 = Team Photo
// Positions 2-12, 14-20 = Players

/** @type {Record<number, string>} */
const BRA_PLAYERS = {
  2:  'Alisson',
  3:  'Bento',
  4:  'Marquinhos',
  5:  'Gabriel Magalhães',
  6:  'Éder Militão',
  7:  'Danilo',
  8:  'Guilherme Arana',
  9:  'Bruno Guimarães',
  10: 'João Gomes',
  11: 'Lucas Paquetá',
  12: 'Luiz Henrique',
  14: 'Vinícius Júnior',
  15: 'Rodrygo',
  16: 'Endrick',
  17: 'Raphinha',
  18: 'Gabriel Martinelli',
  19: 'Neymar Jr',
  20: 'Estêvão',
}

/** @type {Record<number, string>} */
const ARG_PLAYERS = {
  14: 'Lionel Messi',
  15: 'Julián Álvarez',
  16: 'Lautaro Martínez',
}

/** @type {Record<number, string>} */
const FRA_PLAYERS = {
  14: 'Kylian Mbappé',
  15: 'Antoine Griezmann',
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

// ── Sections ──────────────────────────────────────────────────────────────────
// FWC: 16 stickers (00–15), startNumber=0
// Each team: 20 stickers (1=Shield isSpecial, 13=Team Photo, rest=Players)
// LEG: 10 stickers (01–10), startNumber=1

export const SECTIONS = [
  // ── Opening / Stadiums ────────────────────────────────────────────────────
  { code: 'FWC', name: 'FIFA World Cup', flag: '🏆', type: 'special',
    conf: 'FWC', group: 'FWC', count: 16, startNumber: 0 },

  // ── Group A: USA · MEX · CAN · ECU ───────────────────────────────────────
  { code: 'USA', name: 'United States', flag: '🇺🇸', type: 'team', conf: 'CONCACAF', group: 'A', count: 20 },
  { code: 'MEX', name: 'Mexico',        flag: '🇲🇽', type: 'team', conf: 'CONCACAF', group: 'A', count: 20, players: MEX_PLAYERS },
  { code: 'CAN', name: 'Canada',        flag: '🇨🇦', type: 'team', conf: 'CONCACAF', group: 'A', count: 20, players: CAN_PLAYERS },
  { code: 'ECU', name: 'Ecuador',       flag: '🇪🇨', type: 'team', conf: 'CONMEBOL', group: 'A', count: 20 },

  // ── Group B: ESP · NGA · JPN · AUT ───────────────────────────────────────
  { code: 'ESP', name: 'Spain',         flag: '🇪🇸', type: 'team', conf: 'UEFA',     group: 'B', count: 20 },
  { code: 'NGA', name: 'Nigeria',       flag: '🇳🇬', type: 'team', conf: 'CAF',      group: 'B', count: 20 },
  { code: 'JPN', name: 'Japan',         flag: '🇯🇵', type: 'team', conf: 'AFC',      group: 'B', count: 20 },
  { code: 'AUT', name: 'Austria',       flag: '🇦🇹', type: 'team', conf: 'UEFA',     group: 'B', count: 20 },

  // ── Group C: BRA · MAR · HAI · SCO ───────────────────────────────────────
  { code: 'BRA', name: 'Brazil',        flag: '🇧🇷', type: 'team', conf: 'CONMEBOL', group: 'C', count: 20, players: BRA_PLAYERS },
  { code: 'MAR', name: 'Morocco',       flag: '🇲🇦', type: 'team', conf: 'CAF',      group: 'C', count: 20 },
  { code: 'HAI', name: 'Haiti',         flag: '🇭🇹', type: 'team', conf: 'CONCACAF', group: 'C', count: 20 },
  { code: 'SCO', name: 'Scotland',      flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', type: 'team', conf: 'UEFA',     group: 'C', count: 20 },

  // ── Group D: FRA · COL · AUS · MLI ───────────────────────────────────────
  { code: 'FRA', name: 'France',        flag: '🇫🇷', type: 'team', conf: 'UEFA',     group: 'D', count: 20, players: FRA_PLAYERS },
  { code: 'COL', name: 'Colombia',      flag: '🇨🇴', type: 'team', conf: 'CONMEBOL', group: 'D', count: 20 },
  { code: 'AUS', name: 'Australia',     flag: '🇦🇺', type: 'team', conf: 'AFC',      group: 'D', count: 20 },
  { code: 'MLI', name: 'Mali',          flag: '🇲🇱', type: 'team', conf: 'CAF',      group: 'D', count: 20 },

  // ── Group E: ARG · NED · KOR · GHA ───────────────────────────────────────
  { code: 'ARG', name: 'Argentina',     flag: '🇦🇷', type: 'team', conf: 'CONMEBOL', group: 'E', count: 20, players: ARG_PLAYERS },
  { code: 'NED', name: 'Netherlands',   flag: '🇳🇱', type: 'team', conf: 'UEFA',     group: 'E', count: 20 },
  { code: 'KOR', name: 'South Korea',   flag: '🇰🇷', type: 'team', conf: 'AFC',      group: 'E', count: 20 },
  { code: 'GHA', name: 'Ghana',         flag: '🇬🇭', type: 'team', conf: 'CAF',      group: 'E', count: 20 },

  // ── Group F: ENG · URU · EGY · UZB ───────────────────────────────────────
  { code: 'ENG', name: 'England',       flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', type: 'team', conf: 'UEFA',     group: 'F', count: 20 },
  { code: 'URU', name: 'Uruguay',       flag: '🇺🇾', type: 'team', conf: 'CONMEBOL', group: 'F', count: 20 },
  { code: 'EGY', name: 'Egypt',         flag: '🇪🇬', type: 'team', conf: 'CAF',      group: 'F', count: 20 },
  { code: 'UZB', name: 'Uzbekistan',    flag: '🇺🇿', type: 'team', conf: 'AFC',      group: 'F', count: 20 },

  // ── Group G: GER · SEN · KSA · PAN ───────────────────────────────────────
  { code: 'GER', name: 'Germany',       flag: '🇩🇪', type: 'team', conf: 'UEFA',     group: 'G', count: 20 },
  { code: 'SEN', name: 'Senegal',       flag: '🇸🇳', type: 'team', conf: 'CAF',      group: 'G', count: 20 },
  { code: 'KSA', name: 'Saudi Arabia',  flag: '🇸🇦', type: 'team', conf: 'AFC',      group: 'G', count: 20 },
  { code: 'PAN', name: 'Panama',        flag: '🇵🇦', type: 'team', conf: 'CONCACAF', group: 'G', count: 20 },

  // ── Group H: POR · CRO · IRQ · CRC ───────────────────────────────────────
  { code: 'POR', name: 'Portugal',      flag: '🇵🇹', type: 'team', conf: 'UEFA',     group: 'H', count: 20 },
  { code: 'CRO', name: 'Croatia',       flag: '🇭🇷', type: 'team', conf: 'UEFA',     group: 'H', count: 20 },
  { code: 'IRQ', name: 'Iraq',          flag: '🇮🇶', type: 'team', conf: 'AFC',      group: 'H', count: 20 },
  { code: 'CRC', name: 'Costa Rica',    flag: '🇨🇷', type: 'team', conf: 'CONCACAF', group: 'H', count: 20 },

  // ── Group I: ITA · SUI · ALG · JAM ───────────────────────────────────────
  { code: 'ITA', name: 'Italy',         flag: '🇮🇹', type: 'team', conf: 'UEFA',     group: 'I', count: 20 },
  { code: 'SUI', name: 'Switzerland',   flag: '🇨🇭', type: 'team', conf: 'UEFA',     group: 'I', count: 20 },
  { code: 'ALG', name: 'Algeria',       flag: '🇩🇿', type: 'team', conf: 'CAF',      group: 'I', count: 20 },
  { code: 'JAM', name: 'Jamaica',       flag: '🇯🇲', type: 'team', conf: 'CONCACAF', group: 'I', count: 20 },

  // ── Group J: BEL · DEN · TUN · NZL ───────────────────────────────────────
  { code: 'BEL', name: 'Belgium',       flag: '🇧🇪', type: 'team', conf: 'UEFA',     group: 'J', count: 20 },
  { code: 'DEN', name: 'Denmark',       flag: '🇩🇰', type: 'team', conf: 'UEFA',     group: 'J', count: 20 },
  { code: 'TUN', name: 'Tunisia',       flag: '🇹🇳', type: 'team', conf: 'CAF',      group: 'J', count: 20 },
  { code: 'NZL', name: 'New Zealand',   flag: '🇳🇿', type: 'team', conf: 'OFC',      group: 'J', count: 20 },

  // ── Group K: SVK · HUN · PAR · RSA ───────────────────────────────────────
  { code: 'SVK', name: 'Slovakia',      flag: '🇸🇰', type: 'team', conf: 'UEFA',     group: 'K', count: 20 },
  { code: 'HUN', name: 'Hungary',       flag: '🇭🇺', type: 'team', conf: 'UEFA',     group: 'K', count: 20 },
  { code: 'PAR', name: 'Paraguay',      flag: '🇵🇾', type: 'team', conf: 'CONMEBOL', group: 'K', count: 20 },
  { code: 'RSA', name: 'South Africa',  flag: '🇿🇦', type: 'team', conf: 'CAF',      group: 'K', count: 20 },

  // ── Group L: UKR · TUR · CHI · CMR ───────────────────────────────────────
  { code: 'UKR', name: 'Ukraine',       flag: '🇺🇦', type: 'team', conf: 'UEFA',     group: 'L', count: 20 },
  { code: 'TUR', name: 'Turkey',        flag: '🇹🇷', type: 'team', conf: 'UEFA',     group: 'L', count: 20 },
  { code: 'CHI', name: 'Chile',         flag: '🇨🇱', type: 'team', conf: 'CONMEBOL', group: 'L', count: 20 },
  { code: 'CMR', name: 'Cameroon',      flag: '🇨🇲', type: 'team', conf: 'CAF',      group: 'L', count: 20 },

  // ── Legends ───────────────────────────────────────────────────────────────
  { code: 'LEG', name: 'Legends',       flag: '⭐', type: 'special',
    conf: 'LEG', group: 'LEG', count: 10, startNumber: 1 },
]

export const GROUP_ORDER = ['FWC', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'LEG']

export const CONF_ORDER = ['CONMEBOL', 'CONCACAF', 'UEFA', 'CAF', 'AFC', 'OFC', 'LEG', 'FWC']

export const CONF_LABELS = {
  CONMEBOL: 'South America',
  CONCACAF: 'N/C America',
  UEFA:     'Europe',
  CAF:      'Africa',
  AFC:      'Asia',
  OFC:      'Oceania',
  LEG:      'Legends',
  FWC:      'FIFA World Cup',
}

export const SEED_DATA = SECTIONS
