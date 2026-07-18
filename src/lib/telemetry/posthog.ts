import type { PostHog } from 'posthog-js'
import { sanitizeAnalyticsProps } from './events'
import { scrubPosthogProperties } from './urlScrub'
import type {
  TelemetryCapturePort,
  TelemetryFlagsPort,
} from './types'

let client: PostHog | null = null

function readFlag(ph: PostHog, key: string): boolean {
  try {
    const v = ph.getFeatureFlag(key)
    return v === true || v === 'true'
  } catch {
    return false
  }
}

function readVariant(ph: PostHog, key: string): string | null {
  try {
    const v = ph.getFeatureFlag(key)
    return typeof v === 'string' ? v : null
  } catch {
    return null
  }
}

function createFlagsAdapter(ph: PostHog): TelemetryFlagsPort {
  return {
    flag: (key) => readFlag(ph, key),
    variant: (key) => readVariant(ph, key),
    onFeatureFlags(listener) {
      try {
        const unsubscribe = ph.onFeatureFlags(() => listener())
        ph.reloadFeatureFlags()
        return unsubscribe
      } catch {
        return () => {}
      }
    },
  }
}

function createCaptureAdapter(ph: PostHog): TelemetryCapturePort {
  return {
    track(event, props, options) {
      try {
        const safe = sanitizeAnalyticsProps(props)
        const captureOpts = options?.timestamp ? { timestamp: options.timestamp } : undefined
        ph.capture(event, safe as Record<string, unknown> | undefined, captureOpts)
      } catch {
        /* ad-block / private mode */
      }
    },
    setUser(userId, traits) {
      try {
        ph.identify(userId, traits as Record<string, unknown> | undefined)
      } catch {
        /* noop */
      }
    },
    reset() {
      try {
        ph.reset()
      } catch {
        /* noop */
      }
    },
  }
}

/**
 * Loads the PostHog SDK with **capture disabled** so feature flags can be
 * evaluated before the user decides on analytics consent. The `/flags` POST
 * carries the opaque `distinct_id` derived from a one-way hash of the
 * Supabase user id (see `userIdentity.ts`) — no PII, no behaviour data, no
 * identifier reversible to the user. Capture + identify only run after
 * `activatePostHogCapture` is called from the consent grant path.
 *
 * LGPD: rationale is documented in `docs/mvp-quality-and-observability.md`.
 */
export async function bootstrapPostHogFlags(
  userTelemetryId: string,
): Promise<TelemetryFlagsPort | null> {
  if (import.meta.env.DEV) return null
  const key = import.meta.env.VITE_POSTHOG_KEY
  if (!key) return null

  try {
    const posthog = (await import('posthog-js')).default
    const host = import.meta.env.VITE_POSTHOG_HOST ?? 'https://us.i.posthog.com'

    if (!client) {
      posthog.init(key, {
        api_host: host,
        person_profiles: 'identified_only',
        capture_pageview: false,
        autocapture: false,
        sanitize_properties: scrubPosthogProperties,
        persistence: 'localStorage+cookie',
        // Critical: defer capture until consent grant. The SDK still calls
        // `/flags` (needed for feature gating), but suppresses every
        // `capture()` and `identify()` until `opt_in_capturing()` runs.
        opt_out_capturing_by_default: true,
        bootstrap: {
          distinctID: userTelemetryId,
        },
      })
      client = posthog
    }

    return createFlagsAdapter(client)
  } catch {
    return null
  }
}

/**
 * Turns on event capture and identifies the user. Must be called only after
 * the user explicitly grants analytics consent. Idempotent: safe to call
 * multiple times.
 */
export function activatePostHogCapture(userTelemetryId: string): TelemetryCapturePort | null {
  if (!client) return null
  try {
    client.opt_in_capturing()
    client.identify(userTelemetryId)
  } catch {
    /* noop */
  }
  return createCaptureAdapter(client)
}

/**
 * Stops event capture without unloading the SDK. **Does not** call
 * `client.reset()` — that would wipe the bootstrapped `distinct_id` and a user
 * who declines would lose the targeted-flags they were eligible for. Capture
 * stays off until `activatePostHogCapture` runs; flag-eval keeps working.
 */
export function deactivatePostHogCapture(): void {
  if (!client) return
  try {
    client.opt_out_capturing()
  } catch {
    /* noop */
  }
}

/**
 * Hard-resets the PostHog client (clears distinct_id, persisted state) and
 * forgets the module-level singleton so a fresh bootstrap can run with a new
 * `distinct_id`. Called from `telemetry.reset()` on sign-out, so the next
 * sign-in doesn't inherit the previous user's id.
 */
export function resetPostHogClient(): void {
  if (!client) return
  try {
    client.opt_out_capturing()
    client.reset()
  } catch {
    /* noop */
  }
  client = null
}
