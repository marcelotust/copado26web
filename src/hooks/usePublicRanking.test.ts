import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { usePublicRanking } from './usePublicRanking'

vi.mock('../lib/supabase', () => ({
  supabase: {
    rpc: vi.fn().mockReturnValue(Promise.resolve({
      data: [
        { user_id: 'u1', nickname: 'alice', display_name: 'Alice', avatar_url: null, owned_count: 900, completion_pct: 90.5, rank: 1 },
        { user_id: 'u2', nickname: 'bob', display_name: 'Bob', avatar_url: null, owned_count: 800, completion_pct: 80.5, rank: 2 },
      ],
      error: null,
    })),
  },
}))

describe('usePublicRanking', () => {
  it('returns loading initially then resolves entries', async () => {
    const { result } = renderHook(() => usePublicRanking())
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.entries).toHaveLength(2)
    expect(result.current.entries[0].nickname).toBe('alice')
    expect(result.current.error).toBeNull()
  })
})
