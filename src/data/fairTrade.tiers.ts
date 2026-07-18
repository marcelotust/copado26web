/**
 * Curadoria editorial para o filtro de "Trocas Justas".
 *
 * Atualizar após convocações finais (jul/2026). Critério das estrelas:
 * top global por Soccer Power Index 2025 + indicados ao Ballon d'Or recentes.
 * Critério dos tiers: FIFA Ranking + histórico em Copas. Cabe revisão de PR.
 */

export type SelectionTier = 'S' | 'A' | 'B' | 'C' | 'D'

export const TIER_ORDER: SelectionTier[] = ['S', 'A', 'B', 'C', 'D']

export function tierIndex(t: SelectionTier): number {
  return TIER_ORDER.indexOf(t)
}

/** Distância máxima entre tiers para considerar troca justa entre regulares. */
export const TIER_TOLERANCE = 1

/** IDs de craques globais — pareiam só entre si na lógica de fairness. */
export const STAR_PLAYERS: ReadonlySet<string> = new Set([
  // Lendas vivas
  'ARG-17', // Lionel Messi
  'POR-15', // Cristiano Ronaldo

  // Top global Ballon d'Or / SPI
  'FRA-20', // Kylian Mbappé
  'NOR-15', // Erling Haaland
  'ENG-11', // Jude Bellingham
  'ESP-15', // Lamine Yamal
  'BRA-14', // Vinicius Júnior
  'BEL-15', // Kevin De Bruyne

  // Elite Top 25 global
  'ARG-19', // Julián Álvarez
  'ESP-11', // Pedri
  'ESP-10', // Rodri
  'FRA-15', // Ousmane Dembélé
  'POR-09', // Bernardo Silva
  'POR-10', // Bruno Fernandes
  'ENG-18', // Harry Kane
  'ENG-16', // Phil Foden
  'ENG-12', // Cole Palmer
  'NOR-10', // Martin Ødegaard
  'NED-03', // Virgil van Dijk
  'BRA-19', // Raphinha
  'BRA-15', // Rodrygo
  'URU-10', // Federico Valverde
  'URU-17', // Darwin Núñez
  'GER-15', // Jamal Musiala
  'MAR-04', // Achraf Hakimi
])

/**
 * Tier de cada seleção. Todas as 48 seleções classificadas para 2026 estão mapeadas.
 * Códigos não-seleção (WAP/FWC/CC) não aparecem aqui — são tratados por categoria especial.
 */
export const TEAM_TIERS: Readonly<Record<string, SelectionTier>> = {
  // Tier S — históricamente decisivas + Top 10 FIFA atual
  BRA: 'S', ARG: 'S', FRA: 'S', ESP: 'S', ENG: 'S',
  GER: 'S', POR: 'S', NED: 'S', BEL: 'S',

  // Tier A — campeãs continentais recentes + Top 25 FIFA
  URU: 'A', CRO: 'A', COL: 'A', MAR: 'A', JPN: 'A',
  USA: 'A', MEX: 'A', KOR: 'A', SUI: 'A', AUT: 'A',
  NOR: 'A', ECU: 'A', AUS: 'A', SEN: 'A',

  // Tier B — sólidas em fase de grupos, raramente vão longe
  IRN: 'B', EGY: 'B', TUN: 'B', GHA: 'B', KSA: 'B',
  CAN: 'B', PAR: 'B', TUR: 'B', SWE: 'B', CZE: 'B',
  ALG: 'B', SCO: 'B',

  // Tier C — estreantes ou competitivas só em janela curta
  RSA: 'C', QAT: 'C', BIH: 'C', COD: 'C', UZB: 'C',
  IRQ: 'C', JOR: 'C', NZL: 'C', PAN: 'C',

  // Tier D — estreantes absolutas / underdogs profundas
  HAI: 'D', CUW: 'D', CPV: 'D', CIV: 'D',
}
