import { track } from '@vercel/analytics'
import { hasAnalyticsConsent } from './consent'

/** @param {string} name @param {Record<string, string | number | boolean | undefined>} [properties] */
export function trackProductEvent(name, properties) {
  if (!hasAnalyticsConsent()) return
  track(name, properties)
}
