import * as Sentry from '@sentry/react'
import { sentryBeforeSend, scrubRecord, scrubValue } from './sentry/sanitize'

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
const isDev = import.meta.env.DEV as boolean
const isProd = import.meta.env.PROD as boolean

let initialized = false
let captureAllowed = false

function resolveEnvironment(): string {
  const vercel = import.meta.env.VERCEL_ENV as string | undefined
  if (vercel) return vercel
  return import.meta.env.MODE as string
}

function resolveRelease(): string | undefined {
  return (
    import.meta.env.VITE_SENTRY_RELEASE
    ?? (import.meta.env.VERCEL_GIT_COMMIT_SHA as string | undefined)
  )
}

/** Initialise once at bootstrap — events are dropped until analytics consent is granted. */
export function initSentryClient(): void {
  if (!dsn || isDev || initialized) return

  Sentry.init({
    dsn,
    environment: resolveEnvironment(),
    release: resolveRelease(),
    sendDefaultPii: false,
    beforeSend(event, hint) {
      if (!captureAllowed) return null
      return sentryBeforeSend(event, hint)
    },
    beforeBreadcrumb(breadcrumb) {
      if (!captureAllowed) return null
      if (breadcrumb.data) {
        breadcrumb.data = scrubRecord(breadcrumb.data as Record<string, unknown>) as typeof breadcrumb.data
      }
      if (breadcrumb.message) {
        breadcrumb.message = String(scrubValue(breadcrumb.message))
      }
      return breadcrumb
    },
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: isProd ? 0.1 : 1.0,
  })

  initialized = true
}

export function isSentryCaptureEnabled(): boolean {
  return Boolean(dsn && !isDev && initialized && captureAllowed)
}

export function grantSentryConsent(userId: string): void {
  if (!dsn || isDev) return
  if (!initialized) initSentryClient()
  captureAllowed = true
  Sentry.setUser({ id: userId })
}

export function revokeSentryConsent(): void {
  captureAllowed = false
  if (initialized) {
    try {
      Sentry.setUser(null)
    } catch {
      /* noop */
    }
  }
}

export { Sentry }
