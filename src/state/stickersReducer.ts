import type { Action, State } from './stickersTypes'
import type { CatalogSticker } from '../types/database'

export const initialState: State = {
  teams:      [],
  catalog:    new Map(),
  byTeam:     new Map(),
  quantities: new Map(),
  status:     'idle',
  error:      null,
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'STATUS':
      return { ...state, status: action.status, error: action.error ?? null }

    case 'CATALOG_LOADED': {
      const catalog = new Map<string, CatalogSticker>(action.stickers.map(s => [s.id, s]))
      const byTeam  = new Map<string, string[]>()
      for (const s of action.stickers) {
        let list = byTeam.get(s.team_code)
        if (!list) { list = []; byTeam.set(s.team_code, list) }
        list.push(s.id)
      }
      for (const list of byTeam.values()) {
        list.sort((a, b) => (catalog.get(a)?.number ?? 0) - (catalog.get(b)?.number ?? 0))
      }
      return { ...state, teams: action.teams, catalog, byTeam }
    }

    case 'QUANTITIES_LOADED': {
      const quantities = new Map<string, number>()
      for (const row of action.rows) {
        if (row.quantity > 0) quantities.set(row.sticker_id, row.quantity)
      }
      return { ...state, quantities, status: 'ready' }
    }

    case 'SET_QUANTITY': {
      const next = new Map(state.quantities)
      if (action.qty <= 0) next.delete(action.id)
      else next.set(action.id, action.qty)
      return { ...state, quantities: next }
    }

    case 'CLEAR_ALL_QUANTITIES':
      return { ...state, quantities: new Map() }

    default:
      return state
  }
}
