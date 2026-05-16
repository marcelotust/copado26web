import { drainPendingExposures } from './anonExperiment'
import { AnalyticsEvent, sanitizeAnalyticsProps } from './events'
import { noopAnalytics, noopErrors } from './noop'
import { activatePostHogAnalytics, deactivatePostHog } from './posthog'
import { vercelAnalytics } from './vercelAdapter'
import { activateSentryErrors, deactivateSentryUser } from './sentry'
import type {
  TelemetryAnalyticsPort,
  TelemetryConsentState,
  TelemetryErrorPort,
  TelemetryFeatureFlagsListener,
  TelemetryProperties,
} from './types'

let analyticsImpl: TelemetryAnalyticsPort = noopAnalytics
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
    analyticsImpl = noopAnalytics
    errorsImpl = noopErrors
    return
  }

  void (async () => {
    try {
      const [analytics, errors] = await Promise.all([
        activatePostHogAnalytics(opts.userId),
        activateSentryErrors(opts.userId),
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
      // Flush any A/B variant assignments made before consent (e.g. on the
      // landing page) so the backing experiment can attribute the exposure.
      for (const exp of drainPendingExposures()) {
        analyticsImpl.track(AnalyticsEvent.EXPERIMENT_EXPOSED, {
          experiment: exp.experiment,
          variant: exp.variant,
          anon_id: exp.anon_id,
          assigned_at: exp.assigned_at,
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
    analyticsImpl.setUser(userId, traits)
    errorsImpl.setUser(userId)
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
    analyticsImpl = noopAnalytics
    errorsImpl = noopErrors
    attachFlagBridge()
    void deactivateAll()
  },
}

export { AnalyticsEvent, FeatureFlag, sanitizeAnalyticsProps } from './events'
export type { AnalyticsEventName, FeatureFlagKey } from './events'
export type { TelemetryConsentState, TelemetryProperties } from './types'
