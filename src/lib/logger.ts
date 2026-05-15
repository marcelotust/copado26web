import { isSentryCaptureEnabled, Sentry } from './sentry'
import { scrubRecord } from './sentry/sanitize'
import { telemetry, type TelemetryProperties } from './telemetry'

/** Structured fields for MVP logs — no PII (email, tokens, free text). */
export type LogFields = {
  feature: string
  action: string
  correlation_id?: string
  error_code?: string
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const isProd = import.meta.env.PROD as boolean

let sessionCorrelationId: string | null = null

function correlationId(explicit?: string): string {
  if (explicit) return explicit
  if (!sessionCorrelationId) {
    sessionCorrelationId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `c_${Date.now()}`
  }
  return sessionCorrelationId
}

export function errorCodeFrom(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    return String((err as { code?: string }).code ?? 'unknown')
  }
  if (err instanceof Error) return err.name
  return 'unknown'
}

function buildPayload(
  fields: LogFields,
  extra?: Record<string, unknown>,
): Record<string, unknown> {
  const { feature, action, correlation_id, error_code, ...rest } = fields as LogFields & Record<string, unknown>
  return scrubRecord({
    feature,
    action,
    correlation_id: correlationId(correlation_id),
    ...(error_code !== undefined ? { error_code } : {}),
    ...rest,
    ...extra,
  })
}

function writeConsole(level: LogLevel, message: string, payload: Record<string, unknown>): void {
  const prefix = `[${level}] ${payload.feature}/${payload.action}`
  const line = `${prefix} ${message}`
  if (level === 'debug') console.debug(line, payload)
  else if (level === 'info') console.info(line, payload)
  else if (level === 'warn') console.warn(line, payload)
  else console.error(line, payload)
}

function writeSentry(level: LogLevel, message: string, payload: Record<string, unknown>, err?: unknown): void {
  if (!isSentryCaptureEnabled()) return
  const sentryLevel = level === 'warn' ? 'warning' : level === 'error' ? 'error' : 'info'
  try {
    Sentry.addBreadcrumb({
      category: 'log',
      message,
      data: payload,
      level: sentryLevel,
    })
    if (level === 'error' && err !== undefined) {
      Sentry.captureException(err instanceof Error ? err : new Error(String(err)), {
        extra: { message, ...payload },
      })
    }
  } catch {
    /* noop */
  }
}

function log(level: LogLevel, message: string, fields: LogFields, err?: unknown, extra?: Record<string, unknown>): void {
  const payload = buildPayload(fields, extra)
  if (!isProd) writeConsole(level, message, payload)
  if (level === 'warn' || level === 'error') writeSentry(level, message, payload, err)
}

/**
 * Structured client logger — see docs/mvp-quality-and-observability.md.
 * Dev: all levels to console. Prod: warn/error → Sentry (after analytics consent).
 */
export const logger = {
  debug(message: string, fields: LogFields, extra?: Record<string, unknown>): void {
    if (isProd) return
    writeConsole('debug', message, buildPayload(fields, extra))
  },

  info(message: string, fields: LogFields, extra?: Record<string, unknown>): void {
    log('info', message, fields, undefined, extra)
  },

  warn(message: string, fields: LogFields, extra?: Record<string, unknown>): void {
    log('warn', message, fields, undefined, extra)
  },

  error(message: string, err: unknown, fields: LogFields, extra?: Record<string, unknown>): void {
    const code = fields.error_code ?? errorCodeFrom(err)
    log('error', message, { ...fields, error_code: code }, err, extra)
  },
}

/** Logger + Sentry capture — use for failures that should appear in error tracking. */
export function reportError(
  message: string,
  err: unknown,
  fields: LogFields,
  extra?: Record<string, unknown>,
): void {
  logger.error(message, err, fields, extra)
  const payload = buildPayload(fields, extra) as TelemetryProperties
  telemetry.error(err instanceof Error ? err : new Error(message), payload)
}

export function isShareAbort(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError'
}
