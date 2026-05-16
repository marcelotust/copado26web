/**
 * Deterministic, cookie-less A/B bucketing for the landing page (and other
 * anonymous surfaces) so experiments can run *before* a user logs in and
 * grants analytics consent.
 *
 * Trade-off vs. PostHog feature flags: assignments are made client-side from
 * a stable random ID in localStorage. PostHog only sees the assignment as an
 * `experiment_exposed` event once the user logs in and consent activates the
 * SDK — at which point any assignments accumulated for the same anon ID get
 * flushed (see flushPendingExposures).
 *
 * Why not boot PostHog for anon visitors: that would make a /decide call to
 * posthog.com before consent, which we explicitly avoid for LGPD posture.
 */

const ANON_ID_KEY = 'meualbum.anon_id'
const ASSIGNMENT_PREFIX = 'meualbum.exp.'
const PENDING_EXPOSURES_KEY = 'meualbum.exp.pending_exposures'

let memoryAnonId: string | null = null
const memoryAssignments = new Map<string, string>()
let memoryPending: PendingExposure[] = []

export type AnonVariantSpec = {
  /** Variant names, e.g. ['control','treatment']. */
  variants: readonly string[]
  /** Parallel weights (default = even split). Must match variants.length. */
  weights?: readonly number[]
}

type PendingExposure = {
  experiment: string
  variant: string
  anon_id: string
  assigned_at: number
}

function safeLocalStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage
  } catch {
    return null
  }
}

function generateAnonId(): string {
  // crypto.randomUUID is available on all browsers we target (modern baseline).
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID()
    }
  } catch { /* fall through */ }
  // Fallback: 16 random hex chars.
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10)
}

export function getAnonId(): string {
  if (memoryAnonId) return memoryAnonId
  const ls = safeLocalStorage()
  if (ls) {
    try {
      const existing = ls.getItem(ANON_ID_KEY)
      if (existing) {
        memoryAnonId = existing
        return existing
      }
    } catch { /* ignore */ }
  }
  const fresh = generateAnonId()
  memoryAnonId = fresh
  if (ls) {
    try { ls.setItem(ANON_ID_KEY, fresh) } catch { /* quota / private mode */ }
  }
  return fresh
}

/** FNV-1a 32-bit hash — deterministic and fast enough for one bucket assignment. */
function hashFnv1a(input: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0
  }
  return h >>> 0
}

function pickVariant(hash: number, spec: AnonVariantSpec): string {
  const variants = spec.variants
  const weights = spec.weights ?? variants.map(() => 1)
  if (variants.length === 0) throw new Error('anonVariant: variants must be non-empty')
  if (weights.length !== variants.length) {
    throw new Error('anonVariant: weights length must match variants length')
  }
  const total = weights.reduce((a, b) => a + b, 0)
  if (total <= 0) throw new Error('anonVariant: weights must sum to a positive number')
  // Use a fractional bucket on [0, total) for stability across weight changes.
  const bucket = (hash / 0xffffffff) * total
  let acc = 0
  for (let i = 0; i < variants.length; i++) {
    acc += weights[i]
    if (bucket < acc) return variants[i]
  }
  return variants[variants.length - 1]
}

function loadPending(): PendingExposure[] {
  if (memoryPending.length > 0) return memoryPending
  const ls = safeLocalStorage()
  if (!ls) return memoryPending
  try {
    const raw = ls.getItem(PENDING_EXPOSURES_KEY)
    if (!raw) return memoryPending
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      memoryPending = parsed.filter(
        (e): e is PendingExposure =>
          typeof e === 'object' && e !== null &&
          typeof (e as PendingExposure).experiment === 'string' &&
          typeof (e as PendingExposure).variant === 'string' &&
          typeof (e as PendingExposure).anon_id === 'string' &&
          typeof (e as PendingExposure).assigned_at === 'number',
      )
    }
  } catch { /* ignore corrupt entry */ }
  return memoryPending
}

function savePending(): void {
  const ls = safeLocalStorage()
  if (!ls) return
  try {
    if (memoryPending.length === 0) {
      ls.removeItem(PENDING_EXPOSURES_KEY)
    } else {
      ls.setItem(PENDING_EXPOSURES_KEY, JSON.stringify(memoryPending))
    }
  } catch { /* quota */ }
}

function recordPending(exp: PendingExposure): void {
  const current = loadPending()
  // De-dupe: one pending exposure per (experiment, anon_id). Newer wins.
  const next = current.filter((e) => !(e.experiment === exp.experiment && e.anon_id === exp.anon_id))
  next.push(exp)
  memoryPending = next
  savePending()
}

/**
 * Resolve an A/B variant for an anonymous visitor. Result is stable across
 * reloads for the same anon ID, and the assignment is queued as a pending
 * exposure so PostHog can record it after consent.
 */
export function getAnonVariant(experimentKey: string, spec: AnonVariantSpec): string {
  const cached = memoryAssignments.get(experimentKey)
  if (cached) return cached

  const ls = safeLocalStorage()
  if (ls) {
    try {
      const stored = ls.getItem(ASSIGNMENT_PREFIX + experimentKey)
      if (stored && spec.variants.includes(stored)) {
        memoryAssignments.set(experimentKey, stored)
        return stored
      }
    } catch { /* ignore */ }
  }

  const anonId = getAnonId()
  const hash = hashFnv1a(`${experimentKey}::${anonId}`)
  const variant = pickVariant(hash, spec)
  memoryAssignments.set(experimentKey, variant)

  if (ls) {
    try { ls.setItem(ASSIGNMENT_PREFIX + experimentKey, variant) } catch { /* quota */ }
  }

  recordPending({
    experiment: experimentKey,
    variant,
    anon_id: anonId,
    assigned_at: Date.now(),
  })

  return variant
}

/** Drains any pending exposure assignments. Caller is responsible for emitting them. */
export function drainPendingExposures(): readonly PendingExposure[] {
  const drained = loadPending().slice()
  memoryPending = []
  savePending()
  return drained
}

/** Test-only reset. Not exported through index.ts. */
export function __resetAnonExperimentForTests(): void {
  memoryAnonId = null
  memoryAssignments.clear()
  memoryPending = []
  const ls = safeLocalStorage()
  if (ls) {
    try {
      ls.removeItem(ANON_ID_KEY)
      ls.removeItem(PENDING_EXPOSURES_KEY)
      const toRemove: string[] = []
      for (let i = 0; i < ls.length; i++) {
        const key = ls.key(i)
        if (key && key.startsWith(ASSIGNMENT_PREFIX)) toRemove.push(key)
      }
      toRemove.forEach((k) => ls.removeItem(k))
    } catch { /* ignore */ }
  }
}
