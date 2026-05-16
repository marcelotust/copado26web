import { AnalyticsEvent, sanitizeAnalyticsProps } from './events'
import { noopAnalytics, noopErrors } from './noop'
import { activatePostHogAnalytics, deactivatePostHog } from './posthog'
import { drainQueuedEvents, queueingAnalytics } from './queue'
import { vercelAnalytics } from './vercelAdapter'
import { activateSentryErrors, deactivateSentryUser } from './sentry'
import { telemetryUserId } from './userIdentity'
import type {
  TelemetryAnalyticsPort,
  TelemetryConsentState,
  TelemetryErrorPort,
  TelemetryFeatureFlagsListener,
  TelemetryProperties,
} from './types'

// Default to the queueing impl so anon events fired before consent (e.g. on the
// landing page) are kept around and replayed once the SDK activates. If consent
// is declined, we swap to the true noop and discard whatever was buffered.
let analyticsImpl: TelemetryAnalyticsPort = queueingAnalytics
let errorsImpl: TelemetryErrorPort = noopErrors
const flagListeners = new Set<TelemetryFeatureFlagsListener>()
let detachFlagBridge: (() => void) | null = null

/** Bumps when consent changes or `reset()` runs so in-flight init never swaps backends late. */
let generation = 0

async function deactivateAll(): Promise<void> {
  await Promise.all([deactivatePostHog(), deactivateSentryUser()])
}

function notifyFlagListeners(): void {
  flagListeners.forEach((listener) => listener())
}

function attachFlagBridge(): void {
  detachFlagBridge?.()
  detachFlagBridge = analyticsImpl.onFeatureFlags(notifyFlagListeners)
  notifyFlagListeners()
}

/**
 * Keeps providers aligned with `useAnalyticsConsent`: nothing loads until `granted`.
 * Safe to call on every render from a `useEffect` — stale async work is ignored.
 */
export function syncTelemetryConsent(opts: { userId: string; consent: TelemetryConsentState }): void {
  const myGen = ++generation

  if (opts.consent !== 'granted') {
    void deactivateAll()
    // Drop any anon events that accumulated while we waited for a decision —
    // declined means the user does not want them sent anywhere.
    drainQueuedEvents()
    analyticsImpl = noopAnalytics
    errorsImpl = noopErrors
    return
  }

  void (async () => {
    try {
      const userTelemetryId = await telemetryUserId(opts.userId)
      const [analytics, errors] = await Promise.all([
        activatePostHogAnalytics(userTelemetryId),
        activateSentryErrors(userTelemetryId),
      ])
      if (myGen !== generation) {
        return
      }
      analyticsImpl = analytics ?? vercelAnalytics
      errorsImpl = errors ?? noopErrors
      attachFlagBridge()
      try {
        const pending = sessionStorage.getItem('analytics_consent_pending')
        if (pending === 'granted') {
          sessionStorage.removeItem('analytics_consent_pending')
          analyticsImpl.track(AnalyticsEvent.CONSENT_ANALYTICS_UPDATED, { granted: true })
        }
      } catch { /* private mode */ }
      // Flush events buffered during the anonymous phase (landing page,
      // signup) with their original timestamps. PostHog's experiment funnel
      // requires exposure events to precede metric events temporally — without
      // backdating, the post-consent flush time would put everything after
      // `auth_signed_in` and the funnel would record zero conversions.
      for (const queued of drainQueuedEvents()) {
        analyticsImpl.track(queued.event, queued.props, {
          timestamp: new Date(queued.timestamp),
        })
      }
    } catch {
      if (myGen === generation) {
        analyticsImpl = noopAnalytics
        errorsImpl = noopErrors
        attachFlagBridge()
      }
    }
  })()
}

/** Public surface — the only module the app should import for telemetry. */
export const telemetry = {
  setUser(userId: string, traits?: TelemetryProperties): void {
    const myGen = generation
    void telemetryUserId(userId).then((userTelemetryId) => {
      if (myGen !== generation) return
      analyticsImpl.setUser(userTelemetryId, traits)
      errorsImpl.setUser(userTelemetryId)
    })
  },

  track(event: string, props?: TelemetryProperties): void {
    analyticsImpl.track(event, sanitizeAnalyticsProps(props))
  },

  flag(key: string): boolean {
    return analyticsImpl.flag(key)
  },

  variant(key: string): string | null {
    return analyticsImpl.variant(key)
  },

  onFeatureFlags(listener: TelemetryFeatureFlagsListener): () => void {
    flagListeners.add(listener)
    listener()
    return () => {
      flagListeners.delete(listener)
    }
  },

  error(err: Error, context?: TelemetryProperties): void {
    errorsImpl.capture(err, context)
  },

  reset(): void {
    generation++
    try {
      analyticsImpl.reset()
      errorsImpl.reset()
    } catch {
      /* noop */
    }
    // Back to buffering — if the user re-enters an anonymous flow (e.g. signs
    // out and lands on the public landing again), we want their events kept
    // until they decide on consent again.
    analyticsImpl = queueingAnalytics
    errorsImpl = noopErrors
    attachFlagBridge()
    void deactivateAll()
  },
}

export { AnalyticsEvent, FeatureFlag, sanitizeAnalyticsProps } from './events'
export type { AnalyticsEventName, FeatureFlagKey } from './events'
export type { TelemetryConsentState, TelemetryProperties } from './types'
