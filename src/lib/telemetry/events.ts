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
  ALBUM_IMPORTED: 'album_imported',
  ALBUM_RESTORED: 'album_restored',
  STICKER_QUANTITY_CHANGED: 'sticker_quantity_changed',
  STICKER_UPDATE_FAILED: 'sticker_update_failed',
  STICKERS_SHARED: 'stickers_shared',
  MILESTONE_SHARED: 'milestone_shared',
  CHALLENGE_COMPLETED: 'challenge_completed',
  NAV_TAB_SELECTED: 'nav_tab_selected',
  EXPORT_CSV_COMPLETED: 'export_csv_completed',
  EXPORT_CSV_FAILED: 'export_csv_failed',
  RESET_ALBUM_CONFIRMED: 'reset_album_confirmed',
  RESET_ALBUM_FAILED: 'reset_album_failed',
  ACCOUNT_DELETION_REQUESTED: 'account_deletion_requested',
  ACCOUNT_DELETION_COMPLETED: 'account_deletion_completed',
  CONSENT_ANALYTICS_UPDATED: 'consent_analytics_updated',
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_SKIPPED: 'onboarding_skipped',
  PAYWALL_SHOWN: 'paywall_shown',
  PAYWALL_DISMISSED: 'paywall_dismissed',
  TRADE_LINK_GENERATED: 'trade_link_generated',
  TRADE_LINK_COPIED: 'trade_link_copied',
  TRADE_LINK_SCANNED: 'trade_link_scanned',
  TRADE_MATCH_VIEWED: 'trade_match_viewed',
  TRADE_LINK_INVALID: 'trade_link_invalid',
  TRADE_LOGIN_REQUIRED: 'trade_login_required',
  TRADE_RECORDED: 'trade_recorded',
  LANDING_VIEWED: 'landing_viewed',
  LANDING_CTA_CLICKED: 'landing_cta_clicked',
  GUEST_ALBUM_VIEWED: 'guest_album_viewed',
  GUEST_STICKER_TAPPED: 'guest_sticker_tapped',
  // Friends & Trades (friends_v1)
  NICKNAME_SET: 'nickname_set',
  NICKNAME_CHANGED: 'nickname_changed',
  PROFILE_VISIBILITY_CHANGED: 'profile_visibility_changed',
  FRIEND_REQUEST_SENT: 'friend_request_sent',
  FRIEND_REQUEST_RECEIVED: 'friend_request_received',
  FRIEND_REQUEST_ACCEPTED: 'friend_request_accepted',
  FRIEND_REQUEST_DECLINED: 'friend_request_declined',
  FRIEND_REMOVED: 'friend_removed',
  FRIEND_PROFILE_VIEWED: 'friend_profile_viewed',
  TRADE_SUGGESTION_VIEWED: 'trade_suggestion_viewed',
  TRADE_SUGGESTION_MATCH_COUNT: 'trade_suggestion_match_count',
  QR_PROFILE_GENERATED: 'qr_profile_generated',
  QR_PROFILE_SCANNED: 'qr_profile_scanned',
  // Social (social_v1)
  DATA_SHARING_CONSENT_MODAL_SHOWN:       'data_sharing_consent_modal_shown',
  DATA_SHARING_CONSENT_MODAL_TO_SETTINGS: 'data_sharing_consent_modal_to_settings',
  RANKING_OPT_IN:                         'ranking_opt_in',
  RANKING_OPT_OUT:                        'ranking_opt_out',
  TRADING_PUBLIC_OPT_IN:                  'trading_public_opt_in',
  TRADING_PUBLIC_OPT_OUT:                 'trading_public_opt_out',
  RANKING_PAGE_VIEWED:                    'ranking_page_viewed',
  TRADING_PARTNERS_PAGE_VIEWED:           'trading_partners_page_viewed',
  TRADE_PARTNER_SHARE:                    'trade_partner_share',
} as const

/** PostHog feature-flag keys used by the app. Centralized so search-by-key works. */
export const FeatureFlag = {
  LANDING_HERO_CTA: 'landing_hero_cta',
} as const

export type FeatureFlagKey = (typeof FeatureFlag)[keyof typeof FeatureFlag]

export type AnalyticsEventName = (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent]

// PII-shaped fragments — match anywhere in the key. These names never appear
// as benign infixes in this codebase.
const BLOCKED_KEY_FRAGMENTS =
  /email|password|name|nickname|message|text|label|player|secret|payload|phone|cpf|href/i

// Sensitive prefixes — match only at the start of a key so existing benign
// keys like `team_code`, `error_code`, `cta_id` keep flowing while a careless
// `code`, `url`, `payload`, `token` etc. introduced in a new event still gets
// dropped. Re-sweep follow-up to PR #203.
const BLOCKED_KEY_PREFIXES = /^(code|url|query|token)(_|$)/i

function isBlockedKey(key: string): boolean {
  return BLOCKED_KEY_FRAGMENTS.test(key) || BLOCKED_KEY_PREFIXES.test(key)
}

/** Drops suspicious keys and non-scalar values before sending to analytics backends. */
export function sanitizeAnalyticsProps(
  props?: TelemetryProperties,
): TelemetryProperties | undefined {
  if (!props) return undefined
  const out: TelemetryProperties = {}
  for (const [key, value] of Object.entries(props)) {
    if (isBlockedKey(key)) continue
    if (value === undefined) continue
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
      out[key] = value
    }
  }
  return Object.keys(out).length > 0 ? out : undefined
}
