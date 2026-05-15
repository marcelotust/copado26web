import { track } from '@vercel/analytics'
import { sanitizeAnalyticsProps } from './events'
import type { TelemetryProperties } from './types'

/** Vercel Web Analytics custom events — only called when analytics consent is granted. */
export function vercelTrack(event: string, props?: TelemetryProperties): void {
  try {
    const safe = sanitizeAnalyticsProps(props)
    track(event, safe)
  } catch {
    /* ad-block / private mode */
  }
}
