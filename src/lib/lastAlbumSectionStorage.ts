const STORAGE_KEY = 'copado26:lastAlbumSection'

export function readLastAlbumSection(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)?.trim()
    if (!raw) return null
    return raw.toUpperCase()
  } catch {
    return null
  }
}

export function writeLastAlbumSection(code: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, code)
  } catch {
    // private mode / quota
  }
}
