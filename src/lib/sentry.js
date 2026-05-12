import * as Sentry from '@sentry/react'
import { configureLogger } from './logger'

const dsn = import.meta.env.VITE_SENTRY_DSN

export function initObservability() {
  if (!dsn) return

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_RELEASE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1,
    beforeSend(event) {
      if (event.user) {
        delete event.user.email
        delete event.user.username
      }
      return event
    },
  })

  configureLogger({
    sink(level, entry, err) {
      Sentry.withScope((scope) => {
        scope.setContext('app', entry)
        if (level === 'error') {
          if (err instanceof Error) Sentry.captureException(err)
          else Sentry.captureMessage(String(entry.action ?? 'client_error'), 'error')
          return
        }
        Sentry.captureMessage(String(entry.action ?? 'client_warn'), 'warning')
      })
    },
  })
}
