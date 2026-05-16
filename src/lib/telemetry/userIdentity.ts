const TELEMETRY_ID_PREFIX = 'u_'
const TELEMETRY_ID_UNAVAILABLE = `${TELEMETRY_ID_PREFIX}unavailable`
const TELEMETRY_HASH_NAMESPACE = 'meualbum2026:user:'

function hex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Pseudonymous third-party observability id.
 *
 * Supabase user ids stay internal; analytics/error vendors receive only this
 * deterministic one-way digest, matching docs/mvp-quality-and-observability.md.
 */
export async function telemetryUserId(userId: string): Promise<string> {
  try {
    const subtle = globalThis.crypto?.subtle
    if (!subtle) return TELEMETRY_ID_UNAVAILABLE

    const payload = new TextEncoder().encode(`${TELEMETRY_HASH_NAMESPACE}${userId}`)
    const digest = await subtle.digest('SHA-256', payload)
    return `${TELEMETRY_ID_PREFIX}${hex(digest)}`
  } catch {
    return TELEMETRY_ID_UNAVAILABLE
  }
}
