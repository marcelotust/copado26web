import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useMyRank } from './useMyRank'

vi.mock('../lib/supabase', () => ({
  supabase: {
    rpc: vi.fn().mockReturnValue(Promise.resolve({
      data: { rank: 5, owned_count: 750, completion_pct: 75.4 },
      error: null,
    })),
  },
}))

describe('useMyRank', () => {
  it('returns null while loading then resolves myRank', async () => {
    const { result } = renderHook(() => useMyRank())
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.myRank?.rank).toBe(5)
    expect(result.current.myRank?.completion_pct).toBe(75.4)
  })
})
