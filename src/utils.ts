// Two real kit colors per team { primary, secondary }
export type TeamPalette = { primary: string; secondary: string }

export const TEAM_COLORS: Record<string, TeamPalette> = {
  // Americas
  USA: { primary: '#B22234', secondary: '#3C3B6E' },
  MEX: { primary: '#006847', secondary: '#CE1126' },
  CAN: { primary: '#FF0000', secondary: '#FFFFFF' },
  ARG: { primary: '#74ACDF', secondary: '#FFFFFF' },
  BRA: { primary: '#009C3B', secondary: '#FFDF00' },
  URU: { primary: '#5EB6E4', secondary: '#FFFFFF' },
  COL: { primary: '#FCD116', secondary: '#003087' },
  ECU: { primary: '#FFD100', secondary: '#003DA5' },
  PAR: { primary: '#D52B1E', secondary: '#009BDE' },
  CHI: { primary: '#D52B1E', secondary: '#003DA5' },
  CRC: { primary: '#002B7F', secondary: '#CE1126' },
  PAN: { primary: '#DA121A', secondary: '#003087' },
  JAM: { primary: '#1a1a1a', secondary: '#FFB81C' },
  HAI: { primary: '#00209F', secondary: '#D21034' },
  // Europe
  FRA: { primary: '#002395', secondary: '#ED2939' },
  ENG: { primary: '#FFFFFF', secondary: '#CF091D' },
  ESP: { primary: '#C60B1E', secondary: '#FFC400' },
  GER: { primary: '#1a1a1a', secondary: '#DD0000' },
  POR: { primary: '#006600', secondary: '#FF0000' },
  ITA: { primary: '#003399', secondary: '#009246' },
  NED: { primary: '#FF4F00', secondary: '#1D4F91' },
  BEL: { primary: '#1a1a1a', secondary: '#FFD700' },
  SUI: { primary: '#FF0000', secondary: '#FFFFFF' },
  CRO: { primary: '#FF0000', secondary: '#003DA5' },
  DEN: { primary: '#C60C30', secondary: '#FFFFFF' },
  SVK: { primary: '#003DA5', secondary: '#FFFFFF' },
  HUN: { primary: '#CE2939', secondary: '#00703C' },
  AUT: { primary: '#ED2939', secondary: '#FFFFFF' },
  TUR: { primary: '#E30A17', secondary: '#FFFFFF' },
  UKR: { primary: '#005BBB', secondary: '#FFD500' },
  SCO: { primary: '#003865', secondary: '#FFFFFF' },
  // Africa
  MAR: { primary: '#C1272D', secondary: '#006233' },
  SEN: { primary: '#00853F', secondary: '#FDEF42' },
  NGA: { primary: '#008751', secondary: '#FFFFFF' },
  EGY: { primary: '#CE1126', secondary: '#1a1a1a' },
  GHA: { primary: '#006B3F', secondary: '#FCD116' },
  TUN: { primary: '#E70013', secondary: '#FFFFFF' },
  ALG: { primary: '#006233', secondary: '#D21034' },
  MLI: { primary: '#14B53A', secondary: '#CE1126' },
  RSA: { primary: '#007A4D', secondary: '#FFB81C' },
  CMR: { primary: '#007A5E', secondary: '#CE1126' },
  // Asia / Oceania
  JPN: { primary: '#BC002D', secondary: '#FFFFFF' },
  KOR: { primary: '#CD2E3A', secondary: '#003478' },
  AUS: { primary: '#FFD700', secondary: '#004B87' },
  UZB: { primary: '#1EB53A', secondary: '#009DD2' },
  IRQ: { primary: '#CE1126', secondary: '#007A3D' },
  KSA: { primary: '#165016', secondary: '#FFFFFF' },
  NZL: { primary: '#1a1a1a', secondary: '#FFFFFF' },
  // WC 2026 additions
  CZE: { primary: '#11457E', secondary: '#D7141A' },
  BIH: { primary: '#002F6C', secondary: '#FECB00' },
  QAT: { primary: '#8A1538', secondary: '#FFFFFF' },
  CUW: { primary: '#002B7F', secondary: '#FFD100' },
  CIV: { primary: '#F77F00', secondary: '#009E60' },
  SWE: { primary: '#005293', secondary: '#FECB00' },
  CPV: { primary: '#003893', secondary: '#FFFFFF' },
  NOR: { primary: '#BA0C2F', secondary: '#00205B' },
  JOR: { primary: '#000000', secondary: '#CE1126' },
  COD: { primary: '#007FFF', secondary: '#F7D618' },
  // Special / virtual sections
  WAP: { primary: '#0F172A', secondary: '#1E3A5F' },
  FWC: { primary: '#1E3A5F', secondary: '#C9A84C' },
  CC:  { primary: '#F40009', secondary: '#FFFFFF' },
  LEG: { primary: '#C9A84C', secondary: '#8B6914' },
}

export function teamColors(code: string): TeamPalette {
  return TEAM_COLORS[code] ?? { primary: '#334155', secondary: '#64748b' }
}

// ── Legacy single-color helpers (kept for components that still use them) ────

const PALETTE = [
  'emerald', 'sky', 'indigo', 'amber', 'rose',
  'teal', 'orange', 'cyan', 'violet', 'fuchsia',
] as const

function hashCode(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0
  }
  return Math.abs(h)
}

export function teamColor(code: string): string {
  return PALETTE[hashCode(code) % PALETTE.length]
}

export function gradientClasses(code: string): string {
  const c = teamColor(code)
  return `from-${c}-600 to-${c}-400`
}

export function ringClass(code: string): string {
  return `ring-${teamColor(code)}-400`
}

export function textClass(code: string): string {
  return `text-${teamColor(code)}-300`
}
