import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'

export function useStickers(teamCode) {
  const stickers = useLiveQuery(
    () => teamCode
      ? db.stickers.where('teamCode').equals(teamCode).sortBy('number')
      : db.stickers.toArray(),
    [teamCode]
  )

  return stickers ?? []
}

export function useProgress() {
  const total     = useLiveQuery(() => db.stickers.count(), []) ?? 0
  const collected = useLiveQuery(() => db.stickers.where('quantity').above(0).count(), []) ?? 0
  const swaps     = useLiveQuery(() => db.stickers.where('quantity').above(1).count(), []) ?? 0
  return { total, collected, swaps }
}

export function useSectionProgress(teamCode) {
  const total     = useLiveQuery(() => db.stickers.where('teamCode').equals(teamCode).count(), [teamCode]) ?? 0
  const collected = useLiveQuery(
    () => db.stickers.where('teamCode').equals(teamCode).filter(s => s.quantity > 0).count(),
    [teamCode]
  ) ?? 0
  return { total, collected }
}

export async function increment(id) {
  await db.stickers.where('id').equals(id).modify(s => { s.quantity += 1 })
}

export async function decrement(id) {
  await db.stickers.where('id').equals(id).modify(s => {
    if (s.quantity > 0) s.quantity -= 1
  })
}

export async function incrementByCode(rawCode) {
  const normalized = rawCode.trim().toUpperCase()
  const [team, numStr] = normalized.split(/[\s-]/)
  if (!team || !numStr) return false

  const id = `${team}-${String(parseInt(numStr, 10)).padStart(2, '0')}`
  const row = await db.stickers.get(id)
  if (!row) return false

  await db.stickers.where('id').equals(id).modify(s => { s.quantity += 1 })
  return id
}
