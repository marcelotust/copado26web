import * as Sentry from '@sentry/react'

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
const isProd = import.meta.env.PROD as boolean

if (dsn) {
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE as string,
    enabled: isProd,
    tracesSampleRate: isProd ? 0.1 : 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Capture replays for 10% of sessions in prod, 100% in dev
    replaysSessionSampleRate: isProd ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
  })
}

export { Sentry }
