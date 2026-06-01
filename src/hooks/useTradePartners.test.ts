import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useTradePartners } from './useTradePartners'

vi.mock('../lib/supabase', () => ({
  supabase: {
    rpc: vi.fn().mockReturnValue(Promise.resolve({
      data: [
        {
          user_id: 'u1', nickname: 'alice', display_name: 'Alice', avatar_url: null,
          completion_pct: 75.0, they_have_i_need: 15, i_have_they_need: 8,
        },
      ],
      error: null,
    })),
  },
}))

describe('useTradePartners', () => {
  it('returns loading then partners', async () => {
    const { result } = renderHook(() => useTradePartners())
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.partners).toHaveLength(1)
    expect(result.current.partners[0].they_have_i_need).toBe(15)
  })
})
