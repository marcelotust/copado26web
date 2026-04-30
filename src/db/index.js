import Dexie from 'dexie'
import { buildStickerRows } from './seed'

export const db = new Dexie('WC2026Album')

db.version(1).stores({
  stickers: 'id, teamCode, number, quantity',
  meta:     'key'
})

export async function initDB() {
  const seeded = await db.meta.get('seeded')
  if (seeded) return

  const rows = buildStickerRows()
  await db.stickers.bulkAdd(rows)
  await db.meta.put({ key: 'seeded', value: true })
}
