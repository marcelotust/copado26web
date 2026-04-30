const PALETTE = [
  'emerald', 'sky', 'indigo', 'amber', 'rose',
  'teal', 'orange', 'cyan', 'violet', 'fuchsia'
]

function hashCode(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0
  }
  return Math.abs(h)
}

export function teamColor(code) {
  return PALETTE[hashCode(code) % PALETTE.length]
}

export function gradientClasses(code) {
  const c = teamColor(code)
  return `from-${c}-600 to-${c}-400`
}

export function ringClass(code) {
  return `ring-${teamColor(code)}-400`
}

export function textClass(code) {
  return `text-${teamColor(code)}-300`
}
