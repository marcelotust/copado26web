/**
 * Buffers track() calls made before analytics consent is granted, so events
 * fired on the anonymous landing page (e.g. `$feature_flag_called`,
 * `landing_viewed`, `landing_cta_clicked`) survive long enough to be replayed
 * with their original timestamps after the user signs in and grants consent.
 *
 * Without this buffer, anon events vanish into the noop adapter and PostHog
 * experiments that include landing-page metrics record zero exposures — even
 * though the underlying A/B assignment is correct.
 *
 * In-memory only by design: a refresh before consent loses the queue, which is
 * acceptable since the variant assignment itself is persisted in localStorage
 * (see anonExperiment.ts) and the funnel measures within-session conversion.
 */
import type {
  TelemetryAnalyticsPort,
  TelemetryProperties,
} from './types'

const MAX_QUEUE_SIZE = 200

export type QueuedEvent = {
  event: string
  props?: TelemetryProperties
  timestamp: number
}

let queue: QueuedEvent[] = []

export const queueingAnalytics: TelemetryAnalyticsPort = {
  track(event, props) {
    if (queue.length >= MAX_QUEUE_SIZE) queue.shift()
    queue.push({ event, props, timestamp: Date.now() })
  },
  flag: () => false,
  variant: () => null,
  onFeatureFlags: () => () => {},
  setUser() {
    // Identify happens at consent activation; no need to buffer.
  },
  reset() {
    queue = []
  },
}

/** Returns and clears all buffered events, preserving insertion order. */
export function drainQueuedEvents(): QueuedEvent[] {
  const drained = queue
  queue = []
  return drained
}

/** Test-only reset hook. Not re-exported through index.ts. */
export function __resetQueueForTests(): void {
  queue = []
}
