import type { PostHog } from 'posthog-js'
import { withVercelAnalytics } from './composite'
import { sanitizeAnalyticsProps } from './events'
import type { TelemetryAnalyticsPort } from './types'

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

function createAdapter(ph: PostHog): TelemetryAnalyticsPort {
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
 * Loads PostHog only after consent. Dynamic import keeps the chunk optional and
 * lets ad-blockers fail without breaking the app.
 */
export async function activatePostHogAnalytics(userId: string): Promise<TelemetryAnalyticsPort | null> {
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
        persistence: 'localStorage+cookie',
        loaded: (ph) => {
          try {
            ph.identify(userId)
          } catch {
            /* noop */
          }
        },
      })
      client = posthog
    } else {
      try {
        client.opt_in_capturing()
        client.identify(userId)
      } catch {
        /* noop */
      }
    }

    return withVercelAnalytics(createAdapter(client))
  } catch {
    return null
  }
}

export async function deactivatePostHog(): Promise<void> {
  if (!client) return
  try {
    client.opt_out_capturing()
    client.reset()
  } catch {
    /* noop */
  }
}
