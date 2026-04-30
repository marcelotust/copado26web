import Dexie from 'dexie'
import { buildStickerRows } from './seed'

export const db = new Dexie('WC2026Album')

// v1 → v2: album restructured to 980 stickers (48 teams × 20 + FWC 20).
db.version(2).stores({
  stickers: 'id, teamCode, number, quantity',
  meta:     'key'
}).upgrade(async tx => {
  await tx.table('stickers').clear()
  await tx.table('meta').clear()
})

// v2 → v3: sticker numbering corrected (pos 1=Shield, pos 13=Team Photo);
// added `label` field with player names, Shield and Team Photo metadata.
db.version(3).stores({
  stickers: 'id, teamCode, number, quantity',
  meta:     'key'
}).upgrade(async tx => {
  await tx.table('stickers').clear()
  await tx.table('meta').clear()
})

export async function initDB() {
  const seeded = await db.meta.get('seeded')
  if (seeded) return

  const rows = buildStickerRows()
  await db.stickers.bulkAdd(rows)
  await db.meta.put({ key: 'seeded', value: true })
}
