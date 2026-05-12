const SENSITIVE_KEY = /(email|token|authorization|password|cookie)/i

/** @type {Record<string, unknown>} */
let globalContext = {}

/** @type {((level: string, entry: Record<string, unknown>, err?: unknown) => void) | null} */
let sink = null

/** @param {unknown} value */
function sanitize(value) {
  if (value == null) return value
  if (value instanceof Error) {
    return { name: value.name, message: value.message }
  }
  if (typeof value !== 'object') return value

  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item))
  }

  /** @type {Record<string, unknown>} */
  const out = {}
  for (const [key, nested] of Object.entries(value)) {
    if (SENSITIVE_KEY.test(key)) continue
    out[key] = typeof nested === 'object' ? sanitize(nested) : nested
  }
  return out
}

/**
 * @param {string} level
 * @param {string} feature
 * @param {string} action
 * @param {Record<string, unknown>} [context]
 */
function format(level, feature, action, context = {}) {
  return {
    level,
    feature,
    action,
    ts: new Date().toISOString(),
    ...sanitize({ ...globalContext, ...context }),
  }
}

/**
 * @param {string} level
 * @param {string} feature
 * @param {string} action
 * @param {Record<string, unknown>} [context]
 * @param {unknown} [err]
 */
function write(level, feature, action, context, err) {
  const entry = format(level, feature, action, context)

  if (import.meta.env.DEV) {
    const fn = level === 'error'
      ? console.error
      : level === 'warn'
        ? console.warn
        : console.info
    if (err) fn('[app]', entry, err)
    else fn('[app]', entry)
  }

  if (sink && (level === 'warn' || level === 'error')) {
    sink(level, entry, err)
  }
}

/** @param {{ context?: Record<string, unknown>, sink?: typeof sink }} [options] */
export function configureLogger(options = {}) {
  if (options.context) {
    globalContext = { ...globalContext, ...options.context }
  }
  if (options.sink) {
    sink = options.sink
  }
}

/** @param {string} feature */
export function createLogger(feature) {
  return {
    debug(action, context) {
      write('debug', feature, action, context)
    },
    info(action, context) {
      write('info', feature, action, context)
    },
    warn(action, context, err) {
      write('warn', feature, action, context, err)
    },
    error(action, context, err) {
      write('error', feature, action, context, err)
    },
  }
}

export function resetLoggerForTests() {
  globalContext = {}
  sink = null
}
