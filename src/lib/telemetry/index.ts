import { noopAnalytics, noopErrors } from './noop'
import { activatePostHogAnalytics, deactivatePostHog } from './posthog'
import { activateSentryErrors, deactivateSentryUser } from './sentry'
import type { TelemetryAnalyticsPort, TelemetryConsentState, TelemetryErrorPort, TelemetryProperties } from './types'

let analyticsImpl: TelemetryAnalyticsPort = noopAnalytics
let errorsImpl: TelemetryErrorPort = noopErrors

/** Bumps when consent changes or `reset()` runs so in-flight init never swaps backends late. */
let generation = 0

async function deactivateAll(): Promise<void> {
  await Promise.all([deactivatePostHog(), deactivateSentryUser()])
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
      analyticsImpl = analytics ?? noopAnalytics
      errorsImpl = errors ?? noopErrors
    } catch {
      if (myGen === generation) {
        analyticsImpl = noopAnalytics
        errorsImpl = noopErrors
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
    analyticsImpl.track(event, props)
  },

  flag(key: string): boolean {
    return analyticsImpl.flag(key)
  },

  variant(key: string): string | null {
    return analyticsImpl.variant(key)
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
    void deactivateAll()
  },
}

export type { TelemetryConsentState, TelemetryProperties } from './types'
