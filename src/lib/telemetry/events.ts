/**
 * MVP product analytics taxonomy — see docs/mvp-quality-and-observability.md.
 * Activation/retention metrics: docs/mvp-activation-retention.md.
 * snake_case names; no PII (email, free text, images).
 */
import type { TelemetryProperties } from './types'

export const AnalyticsEvent = {
  AUTH_MAGIC_LINK_REQUESTED: 'auth_magic_link_requested',
  AUTH_MAGIC_LINK_FAILED: 'auth_magic_link_failed',
  AUTH_GOOGLE_STARTED: 'auth_google_started',
  AUTH_SIGNED_IN: 'auth_signed_in',
  AUTH_SIGNED_OUT: 'auth_signed_out',
  ALBUM_SEEDED: 'album_seeded',
  ALBUM_SEED_FAILED: 'album_seed_failed',
  STICKER_QUANTITY_CHANGED: 'sticker_quantity_changed',
  STICKER_UPDATE_FAILED: 'sticker_update_failed',
  NAV_TAB_SELECTED: 'nav_tab_selected',
  EXPORT_CSV_COMPLETED: 'export_csv_completed',
  EXPORT_CSV_FAILED: 'export_csv_failed',
  RESET_ALBUM_CONFIRMED: 'reset_album_confirmed',
  RESET_ALBUM_FAILED: 'reset_album_failed',
  ACCOUNT_DELETION_REQUESTED: 'account_deletion_requested',
  ACCOUNT_DELETION_COMPLETED: 'account_deletion_completed',
  CONSENT_ANALYTICS_UPDATED: 'consent_analytics_updated',
} as const

export type AnalyticsEventName = (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent]

const BLOCKED_PROP_KEYS = /email|password|name|message|text|label|player/i

/** Drops suspicious keys and non-scalar values before sending to analytics backends. */
export function sanitizeAnalyticsProps(
  props?: TelemetryProperties,
): TelemetryProperties | undefined {
  if (!props) return undefined
  const out: TelemetryProperties = {}
  for (const [key, value] of Object.entries(props)) {
    if (BLOCKED_PROP_KEYS.test(key)) continue
    if (value === undefined) continue
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
      out[key] = value
    }
  }
  return Object.keys(out).length > 0 ? out : undefined
}
