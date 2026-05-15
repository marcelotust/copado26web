import { logger } from './logger'

const STORAGE_VERSION = 1 as const
const MAX_BACKUP_DAYS = 30

export type AlbumBackupEntry = {
  date: string
  savedAt: string
  csv: string
}

type StoredShape = {
  v: typeof STORAGE_VERSION
  items: AlbumBackupEntry[]
}

function key(userId: string): string {
  return `meualbum2026_album_backups_${userId}`
}

function readRaw(userId: string): StoredShape | null {
  try {
    const raw = localStorage.getItem(key(userId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredShape
    if (parsed?.v !== STORAGE_VERSION || !Array.isArray(parsed.items)) return null
    return parsed
  } catch {
    return null
  }
}

export function listAlbumBackups(userId: string): AlbumBackupEntry[] {
  const data = readRaw(userId)
  if (!data) return []
  return [...data.items].sort((a, b) => b.date.localeCompare(a.date))
}

/** Replace or insert today's row, cap list at MAX_BACKUP_DAYS by dropping oldest calendar dates. */
export function upsertTodayAlbumBackup(userId: string, csv: string): void {
  const d = new Date()
  const date = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')

  const prev = readRaw(userId)?.items ?? []
  const withoutToday = prev.filter(e => e.date !== date)
  const next: AlbumBackupEntry[] = [
    { date, savedAt: new Date().toISOString(), csv },
    ...withoutToday,
  ].sort((a, b) => b.date.localeCompare(a.date))

  const trimmed = next.slice(0, MAX_BACKUP_DAYS)
  try {
    localStorage.setItem(key(userId), JSON.stringify({ v: STORAGE_VERSION, items: trimmed }))
  } catch (e) {
    logger.warn('localStorage backup write failed', { feature: 'album', action: 'backup_persist' })
  }
}
