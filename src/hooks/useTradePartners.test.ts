import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useTradePartners } from './useTradePartners'

vi.mock('../lib/supabase', () => ({
  supabase: {
    rpc: vi.fn().mockReturnValue(Promise.resolve({
      data: [
        // RPC returns rows ordered by sum(they_have + i_have). We re-sort by they_have_i_need.
        { user_id: 'u1', nickname: 'alice', display_name: 'Alice', avatar_url: null,
          completion_pct: 75.0, they_have_i_need: 5, i_have_they_need: 20 },
        { user_id: 'u2', nickname: 'bob', display_name: 'Bob', avatar_url: null,
          completion_pct: 60.0, they_have_i_need: 18, i_have_they_need: 3 },
        { user_id: 'u3', nickname: 'carol', display_name: 'Carol', avatar_url: null,
          completion_pct: 50.0, they_have_i_need: 18, i_have_they_need: 1 },
      ],
      error: null,
    })),
  },
}))

describe('useTradePartners', () => {
  it('sorts partners by they_have_i_need desc, with i_have_they_need as tiebreaker', async () => {
    const { result } = renderHook(() => useTradePartners())
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.partners.map(p => p.nickname)).toEqual(['bob', 'carol', 'alice'])
  })
})
