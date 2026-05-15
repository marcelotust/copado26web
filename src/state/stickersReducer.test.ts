import { describe, expect, it } from 'vitest'
import { initialState, reducer } from './stickersReducer'

describe('stickersReducer', () => {
  it('SET_QUANTITY clamps zero to delete', () => {
    const withQty = reducer(
      { ...initialState, quantities: new Map([['BRA-01', 2]]) },
      { type: 'SET_QUANTITY', id: 'BRA-01', qty: 0 },
    )
    expect(withQty.quantities.has('BRA-01')).toBe(false)
  })

  it('CLEAR_ALL_QUANTITIES empties map', () => {
    const next = reducer(
      { ...initialState, quantities: new Map([['BRA-01', 1]]) },
      { type: 'CLEAR_ALL_QUANTITIES' },
    )
    expect(next.quantities.size).toBe(0)
  })

  it('QUANTITIES_LOADED sets ready status', () => {
    const next = reducer(initialState, {
      type: 'QUANTITIES_LOADED',
      rows: [{ sticker_id: 'BRA-01', quantity: 3 }],
    })
    expect(next.status).toBe('ready')
    expect(next.quantities.get('BRA-01')).toBe(3)
  })
})
