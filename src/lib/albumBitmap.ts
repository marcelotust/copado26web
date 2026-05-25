/**
 * Whole-album state encoded as a positional 2-bit-per-card bitmap, dense enough
 * to fit the entire collection (≈994 cards) in a single QR code (~256 bytes).
 *
 * Each card maps to one index in the canonical catalog order (sorted by
 * `sort_order`). Two bits per card encode: 0 = missing, 1 = have one,
 * 2 = have a spare (repetida). Both peers derive the order from their own local
 * catalog; a version byte + card count + checksum in the header let the reader
 * detect a divergent catalog and refuse to apply a stale mapping.
 *
 * Used by the in-person trade flow: scanning a friend's QR yields, with no
 * ambiguity, both what they have spare (feeds +1) and what they lack (feeds -1).
 */

const PREFIX = 'mab:'
const FORMAT_VERSION = 1
const HEADER_BYTES = 7 // version(1) + count(2) + checksum(4)

export type AlbumQrDecode =
  | { status: 'ok'; swaps: string[]; missing: string[] }
  | { status: 'version_mismatch' }
  | { status: 'invalid' }

/** 0 = missing, 1 = have one, 2 = have a spare. */
function cardState(qty: number): 0 | 1 | 2 {
  if (qty <= 0) return 0
  if (qty === 1) return 1
  return 2
}

/** FNV-1a 32-bit hash of the ordered id list — a fingerprint of the catalog. */
function catalogChecksum(orderedIds: readonly string[]): number {
  let h = 0x811c9dc5
  const s = orderedIds.join(',')
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

function bytesToBase64url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64urlToBytes(str: string): Uint8Array | null {
  try {
    const padded = str.replace(/-/g, '+').replace(/_/g, '/')
      .padEnd(Math.ceil(str.length / 4) * 4, '=')
    const bin = atob(padded)
    const out = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
    return out
  } catch {
    return null
  }
}

/** Encode the caller's whole-album state into a QR-friendly string. */
export function encodeAlbumBitmap(
  orderedIds: readonly string[],
  quantities: ReadonlyMap<string, number>,
): string {
  const count = orderedIds.length
  const checksum = catalogChecksum(orderedIds)
  const bytes = new Uint8Array(HEADER_BYTES + Math.ceil((count * 2) / 8))

  bytes[0] = FORMAT_VERSION
  bytes[1] = (count >> 8) & 0xff
  bytes[2] = count & 0xff
  bytes[3] = (checksum >>> 24) & 0xff
  bytes[4] = (checksum >>> 16) & 0xff
  bytes[5] = (checksum >>> 8) & 0xff
  bytes[6] = checksum & 0xff

  for (let i = 0; i < count; i++) {
    const state = cardState(quantities.get(orderedIds[i]!) ?? 0)
    bytes[HEADER_BYTES + (i >> 2)]! |= state << ((i % 4) * 2)
  }

  return PREFIX + bytesToBase64url(bytes)
}

/** Decode a scanned string against the reader's local catalog order. */
export function decodeAlbumBitmap(
  value: string,
  orderedIds: readonly string[],
): AlbumQrDecode {
  if (!value.startsWith(PREFIX)) return { status: 'invalid' }
  const bytes = base64urlToBytes(value.slice(PREFIX.length))
  if (!bytes || bytes.length < HEADER_BYTES) return { status: 'invalid' }

  if (bytes[0] !== FORMAT_VERSION) return { status: 'version_mismatch' }

  const count = (bytes[1]! << 8) | bytes[2]!
  if (count !== orderedIds.length) return { status: 'version_mismatch' }

  const checksum = ((bytes[3]! << 24) >>> 0) + (bytes[4]! << 16) + (bytes[5]! << 8) + bytes[6]!
  if ((checksum >>> 0) !== catalogChecksum(orderedIds)) return { status: 'version_mismatch' }

  if (bytes.length < HEADER_BYTES + Math.ceil((count * 2) / 8)) return { status: 'invalid' }

  const swaps: string[] = []
  const missing: string[] = []
  for (let i = 0; i < count; i++) {
    const state = (bytes[HEADER_BYTES + (i >> 2)]! >> ((i % 4) * 2)) & 0b11
    if (state === 2) swaps.push(orderedIds[i]!)
    else if (state === 0) missing.push(orderedIds[i]!)
  }
  return { status: 'ok', swaps, missing }
}
