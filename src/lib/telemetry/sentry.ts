import type { TelemetryErrorPort, TelemetryProperties } from './types'

let inited = false

function toExtra(ctx?: TelemetryProperties): Record<string, unknown> | undefined {
  if (!ctx) return undefined
  return ctx as Record<string, unknown>
}

/**
 * Error reporting behind consent. Only loads Sentry when a DSN is configured.
 */
export async function activateSentryErrors(userId: string): Promise<TelemetryErrorPort | null> {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return null

  try {
    const Sentry = await import('@sentry/react')

    if (!inited) {
      Sentry.init({
        dsn,
        environment: import.meta.env.MODE,
        sendDefaultPii: false,
      })
      inited = true
    }

    Sentry.setUser({ id: userId })

    return {
      capture(err, context) {
        try {
          Sentry.captureException(err, { extra: toExtra(context) })
        } catch {
          /* noop */
        }
      },
      setUser(uid) {
        try {
          Sentry.setUser({ id: uid })
        } catch {
          /* noop */
        }
      },
      reset() {
        try {
          Sentry.setUser(null)
        } catch {
          /* noop */
        }
      },
    }
  } catch {
    return null
  }
}

export async function deactivateSentryUser(): Promise<void> {
  if (!inited) return
  try {
    const Sentry = await import('@sentry/react')
    Sentry.setUser(null)
  } catch {
    /* noop */
  }
}
