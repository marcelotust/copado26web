// Re-export real-kit colors and provide the legacy hash-based single-color
// helpers a couple of components still use.

export { TEAM_COLORS, teamColors } from './teamColors'
export type { TeamPalette } from './teamColors'

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
