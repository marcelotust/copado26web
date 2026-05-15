import { grantSentryConsent, isSentryCaptureEnabled, revokeSentryConsent, Sentry } from '../sentry'
import type { TelemetryErrorPort, TelemetryProperties } from './types'

function toExtra(ctx?: TelemetryProperties): Record<string, unknown> | undefined {
  if (!ctx) return undefined
  return ctx as Record<string, unknown>
}

/**
 * Error reporting behind analytics consent. Uses the singleton client from `src/lib/sentry.ts`.
 */
export async function activateSentryErrors(userId: string): Promise<TelemetryErrorPort | null> {
  if (!import.meta.env.VITE_SENTRY_DSN) return null

  try {
    grantSentryConsent(userId)

    return {
      capture(err, context) {
        if (!isSentryCaptureEnabled()) return
        try {
          Sentry.captureException(err, { extra: toExtra(context) })
        } catch {
          /* noop */
        }
      },
      setUser(uid) {
        if (!isSentryCaptureEnabled()) return
        try {
          Sentry.setUser({ id: uid })
        } catch {
          /* noop */
        }
      },
      reset() {
        revokeSentryConsent()
      },
    }
  } catch {
    return null
  }
}

export async function deactivateSentryUser(): Promise<void> {
  revokeSentryConsent()
}
