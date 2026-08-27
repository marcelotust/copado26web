import { AnalyticsEvent, sanitizeAnalyticsProps } from './events'
import { noopAnalytics, noopErrors, noopFlags } from './noop'
import {
  activatePostHogCapture,
  bootstrapPostHogFlags,
  deactivatePostHogCapture,
  resetPostHogClient,
} from './posthog'
import { drainQueuedEvents, queueingAnalytics } from './queue'
import { vercelAnalytics } from './vercelAdapter'
import { activateSentryErrors, deactivateSentryUser } from './sentry'
import { telemetryUserId } from './userIdentity'
import type {
  TelemetryAnalyticsPort,
  TelemetryCapturePort,
  TelemetryConsentState,
  TelemetryErrorPort,
  TelemetryFeatureFlagsListener,
  TelemetryFlagsPort,
  TelemetryProperties,
} from './types'

// Flags load as soon as we have a `userId`, independent of consent. The
// `/flags` POST sends only the opaque `distinct_id` — see docs/mvp-quality-and-observability.md.
let flagsImpl: TelemetryFlagsPort = noopFlags

// Capture starts buffering anon events (landing CTAs etc.) and is swapped to
// either the PostHog capture adapter (grant), Vercel-only (PostHog blocked),
// or noop (decline).
let captureImpl: TelemetryCapturePort = queueingAnalytics
let errorsImpl: TelemetryErrorPort = noopErrors

const flagListeners = new Set<TelemetryFeatureFlagsListener>()
let detachFlagBridge: (() => void) | null = null

/** Bumps when consent changes or `reset()` runs so in-flight init never swaps backends late. */
let generation = 0

/** Tracks the pseudonymous id used for the current bootstrap, so consent activation reuses it. */
let mountedTelemetryId: string | null = null
let mountInFlight: Promise<void> | null = null

function notifyFlagListeners(): void {
  flagListeners.forEach((listener) => listener())
}

function attachFlagBridge(): void {
  detachFlagBridge?.()
  detachFlagBridge = flagsImpl.onFeatureFlags(notifyFlagListeners)
  notifyFlagListeners()
}

/**
 * Loads PostHog with capture disabled so feature flags resolve before the user
 * decides on consent. Idempotent. Call this once `userId` is available
 * (typically right after auth completes), independent of consent state.
 */
export function mountTelemetryFlags(userId: string): Promise<void> {
  if (mountInFlight) return mountInFlight
  const myGen = generation
  mountInFlight = (async () => {
    try {
      const userTelemetryId = await telemetryUserId(userId)
      if (myGen !== generation) return
      const flags = await bootstrapPostHogFlags(userTelemetryId)
      if (myGen !== generation) return
      mountedTelemetryId = userTelemetryId
      if (flags) {
        flagsImpl = flags
        attachFlagBridge()
      }
    } catch {
      /* SDK blocked / network — keep noop flags */
    } finally {
      mountInFlight = null
    }
  })()
  return mountInFlight
}

async function deactivateCaptureAll(): Promise<void> {
  deactivatePostHogCapture()
  await deactivateSentryUser()
}

/**
 * Aligns capture-side providers with `useAnalyticsConsent`. Flags are
 * mounted separately via `mountTelemetryFlags` and stay live regardless.
 */
export function syncTelemetryConsent(opts: { userId: string; consent: TelemetryConsentState }): void {
  const myGen = ++generation
  // Make sure flag-eval is mounted even if consent never lands.
  void mountTelemetryFlags(opts.userId)

  if (opts.consent !== 'granted') {
    void deactivateCaptureAll()
    // Decline = drop anything the queue accumulated. Null (not decided yet)
    // is handled below by keeping the queueing capture impl active.
    if (opts.consent === 'declined') {
      drainQueuedEvents()
      captureImpl = noopAnalytics
    } else {
      captureImpl = queueingAnalytics
    }
    errorsImpl = noopErrors
    return
  }

  void (async () => {
    try {
      // Wait for flag-mount to finish so the PostHog client exists before we
      // opt in to capture — otherwise we silently downgrade to Vercel-only.
      await mountTelemetryFlags(opts.userId)
      if (myGen !== generation) return
      const userTelemetryId = mountedTelemetryId ?? (await telemetryUserId(opts.userId))
      const phCapture = activatePostHogCapture(userTelemetryId)
      const errors = await activateSentryErrors(userTelemetryId)
      if (myGen !== generation) return
      captureImpl = phCapture ?? vercelAnalytics
      errorsImpl = errors ?? noopErrors
      try {
        const pending = sessionStorage.getItem('analytics_consent_pending')
        if (pending === 'granted') {
          sessionStorage.removeItem('analytics_consent_pending')
          captureImpl.track(AnalyticsEvent.CONSENT_ANALYTICS_UPDATED, { granted: true })
        }
      } catch { /* private mode */ }
      // Flush events buffered during the anonymous phase (landing page,
      // signup) with their original timestamps. PostHog's experiment funnel
      // requires exposure events to precede metric events temporally — without
      // backdating, the post-consent flush time would put everything after
      // `auth_signed_in` and the funnel would record zero conversions.
      for (const queued of drainQueuedEvents()) {
        captureImpl.track(queued.event, queued.props, {
          timestamp: new Date(queued.timestamp),
        })
      }
    } catch {
      if (myGen === generation) {
        captureImpl = noopAnalytics
        errorsImpl = noopErrors
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
      captureImpl.setUser(userTelemetryId, traits)
      errorsImpl.setUser(userTelemetryId)
    })
  },

  track(event: string, props?: TelemetryProperties): void {
    captureImpl.track(event, sanitizeAnalyticsProps(props))
  },

  flag(key: string): boolean {
    return flagsImpl.flag(key)
  },

  variant(key: string): string | null {
    return flagsImpl.variant(key)
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
      captureImpl.reset()
      errorsImpl.reset()
    } catch {
      /* noop */
    }
    flagsImpl = noopFlags
    captureImpl = queueingAnalytics
    errorsImpl = noopErrors
    mountedTelemetryId = null
    mountInFlight = null
    attachFlagBridge()
    // Hard-reset the PostHog client so a new sign-in re-bootstraps with the
    // new user's distinct_id instead of inheriting the previous session's.
    resetPostHogClient()
    void deactivateSentryUser()
  },
}

// `TelemetryAnalyticsPort` is still re-exported through `types` for tests that
// build a full adapter; the runtime uses the split ports.
export type { TelemetryAnalyticsPort }

export { AnalyticsEvent, FeatureFlag, sanitizeAnalyticsProps } from './events'
export type { AnalyticsEventName, FeatureFlagKey } from './events'
export type { TelemetryConsentState, TelemetryProperties } from './types'
