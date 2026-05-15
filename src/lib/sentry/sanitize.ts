import type { ErrorEvent, EventHint } from '@sentry/core'

const SENSITIVE_KEY = /email|password|token|authorization|secret|api[_-]?key|access[_-]?token|refresh|session|cookie|bearer|otp|magic/i

/** Redacts sensitive keys from plain objects before they reach Sentry. */
export function scrubRecord(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(input)) {
    if (SENSITIVE_KEY.test(key)) {
      out[key] = '[redacted]'
      continue
    }
    out[key] = scrubValue(value)
  }
  return out
}

export function scrubValue(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (typeof value === 'string') {
    if (value.includes('@') && value.includes('.')) return '[redacted-email]'
    if (/^eyJ[\w-]+\.[\w-]+\./.test(value)) return '[redacted-jwt]'
    return value.length > 500 ? `${value.slice(0, 500)}…` : value
  }
  if (typeof value === 'number' || typeof value === 'boolean') return value
  if (Array.isArray(value)) return value.map(scrubValue)
  if (typeof value === 'object') return scrubRecord(value as Record<string, unknown>)
  return value
}

export function sentryBeforeSend(event: ErrorEvent, _hint?: EventHint): ErrorEvent | null {
  if (event.user) {
    event.user = { id: event.user.id }
  }
  if (event.request?.headers) {
    event.request.headers = scrubRecord(event.request.headers as Record<string, unknown>) as typeof event.request.headers
  }
  if (event.extra) {
    event.extra = scrubRecord(event.extra as Record<string, unknown>)
  }
  if (event.contexts) {
    for (const [name, ctx] of Object.entries(event.contexts)) {
      if (ctx && typeof ctx === 'object') {
        event.contexts[name] = scrubRecord(ctx as Record<string, unknown>)
      }
    }
  }
  return event
}
