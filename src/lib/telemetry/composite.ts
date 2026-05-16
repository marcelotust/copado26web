import { sanitizeAnalyticsProps } from './events'
import type { TelemetryAnalyticsPort } from './types'
import { vercelTrack } from './vercel'

/** Sends product events to PostHog (flags + capture) and Vercel `track()` in parallel. */
export function withVercelAnalytics(base: TelemetryAnalyticsPort): TelemetryAnalyticsPort {
  return {
    track(event, props, options) {
      const safe = sanitizeAnalyticsProps(props)
      base.track(event, safe, options)
      // Vercel `track()` doesn't support backdating; replayed events fire
      // with current time on that channel. Acceptable: PostHog is the
      // source of truth for the experiment funnel.
      vercelTrack(event, safe)
    },
    flag: base.flag.bind(base),
    variant: base.variant.bind(base),
    onFeatureFlags: base.onFeatureFlags.bind(base),
    setUser: base.setUser.bind(base),
    reset: base.reset.bind(base),
  }
}
