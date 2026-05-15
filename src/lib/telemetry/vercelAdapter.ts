import { sanitizeAnalyticsProps } from './events'
import type { TelemetryAnalyticsPort } from './types'
import { vercelTrack } from './vercel'

/** Vercel-only analytics port (no feature flags). */
export const vercelAnalytics: TelemetryAnalyticsPort = {
  track(event, props) {
    vercelTrack(event, sanitizeAnalyticsProps(props))
  },
  flag: () => false,
  variant: () => null,
  onFeatureFlags: () => () => {},
  setUser() { /* noop */ },
  reset() { /* noop */ },
}
