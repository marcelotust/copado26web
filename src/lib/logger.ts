import { Sentry } from './sentry'

const isProd = import.meta.env.PROD as boolean

export const logger = {
  info(message: string, data?: Record<string, unknown>): void {
    if (!isProd) {
      console.info(`[info] ${message}`, data ?? '')
    }
    Sentry.addBreadcrumb({
      category: 'log',
      message,
      data,
      level: 'info',
    })
  },

  warn(message: string, data?: Record<string, unknown>): void {
    if (!isProd) {
      console.warn(`[warn] ${message}`, data ?? '')
    }
    Sentry.addBreadcrumb({
      category: 'log',
      message,
      data,
      level: 'warning',
    })
  },

  error(message: string, error?: unknown, data?: Record<string, unknown>): void {
    if (!isProd) {
      console.error(`[error] ${message}`, error ?? '', data ?? '')
    }
    Sentry.addBreadcrumb({
      category: 'log',
      message,
      data,
      level: 'error',
    })
    if (error !== undefined) {
      Sentry.captureException(error, { extra: { message, ...data } })
    }
  },
}
