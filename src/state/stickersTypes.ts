import type { CatalogSticker, Sticker, Team } from '../types/database'

export type Status = 'idle' | 'loading' | 'ready' | 'error'

export type State = {
  teams:      Team[]
  catalog:    Map<string, CatalogSticker>
  byTeam:     Map<string, string[]>
  quantities: Map<string, number>
  status:     Status
  error:      Error | null
}

export type Action =
  | { type: 'STATUS'; status: Status; error?: Error | null }
  | { type: 'CATALOG_LOADED'; teams: Team[]; stickers: CatalogSticker[] }
  | { type: 'QUANTITIES_LOADED'; rows: { sticker_id: string; quantity: number }[] }
  | { type: 'SET_QUANTITY'; id: string; qty: number }
  | { type: 'CLEAR_ALL_QUANTITIES' }

export type ContextValue = State & {
  userId: string
  adjust: (stickerId: string, delta: number) => Promise<number | null>
  resetAll: () => Promise<void>
  /** Full replace of quantities (used by CSV import / restore). */
  replaceAllQuantities: (next: Map<string, number>) => Promise<void>
}

export type SwapGroup    = { teamCode: string; stickers: Sticker[] }
export type MissingGroup = { teamCode: string; numbers: number[] }
