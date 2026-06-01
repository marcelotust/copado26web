/**
 * Query/hash params that may carry user-identifying or peer-collection data and
 * must never reach analytics backends. Trade payload (`d`), nickname-based codes
 * (`code`), and Supabase auth callback tokens (`access_token`, `refresh_token`,
 * `token_hash`) — any of these in $current_url indexes that value to the viewer's
 * distinct_id, which is a cross-user crossover this app avoids by design.
 */
const SENSITIVE_PARAMS = new Set([
  'd',
  'code',
  'access_token',
  'refresh_token',
  'token_hash',
])

/** Path patterns whose dynamic segment must be replaced with a placeholder. */
const PATH_REPLACEMENTS: Array<[RegExp, string]> = [
  // /u/<nickname> — reversible user identifier per AGENTS.md
  [/^\/u\/[^/]+/, '/u/:nick'],
]

function scrubSearchString(search: string): string {
  if (!search) return search
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  let mutated = false
  for (const key of Array.from(params.keys())) {
    if (SENSITIVE_PARAMS.has(key)) {
      params.set(key, 'REDACTED')
      mutated = true
    }
  }
  if (!mutated) return search
  const next = params.toString()
  return next ? `?${next}` : ''
}

function scrubPath(pathname: string): string {
  for (const [re, replacement] of PATH_REPLACEMENTS) {
    const match = pathname.match(re)
    if (match) return pathname.replace(re, replacement)
  }
  return pathname
}

/** Scrub a pathname string (no scheme/host). Used for PostHog `$pathname`. */
export function scrubPathname(pathname: string | null | undefined): string {
  if (!pathname || typeof pathname !== 'string') return pathname ?? ''
  const [path, search = ''] = pathname.split('?', 2)
  return `${scrubPath(path)}${scrubSearchString(search ? `?${search}` : '')}`
}

/**
 * Scrub an absolute URL string. Used for PostHog `$current_url` / `$referrer` /
 * `$initial_*`, and for the Vercel Analytics `beforeSend(event).url` hook.
 *
 * Defensive: if the input is not a parseable URL, return it unchanged — the
 * downstream pipeline should still pass it through `sanitizeAnalyticsProps`
 * which drops non-scalar values.
 */
export function scrubUrl(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') return input ?? ''
  try {
    const url = new URL(input)
    url.pathname = scrubPath(url.pathname)
    url.search = scrubSearchString(url.search)
    // Hashes can carry Supabase auth tokens (#access_token=…) post-magic-link.
    if (url.hash && url.hash.length > 1) {
      const stripped = scrubSearchString(url.hash.slice(1))
      url.hash = stripped ? `#${stripped.slice(1)}` : ''
    }
    return url.toString()
  } catch {
    return input
  }
}

/** Property keys whose value is a URL or path that must be scrubbed. */
const URL_PROP_KEYS = new Set([
  '$current_url',
  '$referrer',
  '$initial_current_url',
  '$initial_referrer',
])

const PATH_PROP_KEYS = new Set([
  '$pathname',
  '$initial_pathname',
])

/**
 * PostHog `sanitize_properties` hook. Runs on every event before send and
 * rewrites URL-shaped properties so the trade payload / nickname / auth tokens
 * never leave the device.
 */
export function scrubPosthogProperties(
  properties: Record<string, unknown>,
): Record<string, unknown> {
  for (const key of Object.keys(properties)) {
    const value = properties[key]
    if (typeof value !== 'string') continue
    if (URL_PROP_KEYS.has(key)) properties[key] = scrubUrl(value)
    else if (PATH_PROP_KEYS.has(key)) properties[key] = scrubPathname(value)
  }
  return properties
}
