import { renderHook, act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Challenge } from '../data/challenges'
import type { ChallengeResult } from './useChallengeProgress'
import type { Status } from '../state/stickersTypes'

const upsert = vi.fn().mockResolvedValue({ error: null })
vi.mock('../lib/supabase', () => ({
  supabase: { from: () => ({ upsert }) },
}))

const trackMock = vi.fn()
vi.mock('../lib/telemetry', () => ({
  AnalyticsEvent: { CHALLENGE_COMPLETED: 'challenge_completed' },
  telemetry: { track: (...args: unknown[]) => trackMock(...args) },
}))

vi.mock('../lib/logger', () => ({ reportError: vi.fn() }))

let mockResults: ChallengeResult[] = []
let mockStatus: Status = 'loading'

vi.mock('./useChallengeProgress', () => ({
  useChallengeProgress: () => mockResults,
}))

vi.mock('../state/StickersProvider', () => ({
  useStickersContext: () => ({ progressGeneration: mockProgressGeneration }),
}))
vi.mock('../state/selectors', () => ({
  useStickersStatus: () => ({ status: mockStatus, error: null }),
}))

let mockProgressGeneration = 0

import { useChallengeCompletion } from './useChallengeCompletion'

function challenge(id: string): Challenge {
  return {
    id, icon: '⚽', difficulty: 'easy', albumTotal: true, requiredQty: 1,
  }
}

function result(c: Challenge, completed: boolean): ChallengeResult {
  return { challenge: c, owned: completed ? 1 : 0, total: 1, pct: completed ? 100 : 0, completed }
}

describe('useChallengeCompletion', () => {
  beforeEach(() => {
    localStorage.clear()
    mockResults = []
    mockStatus = 'loading'
    mockProgressGeneration = 0
    trackMock.mockReset()
    upsert.mockClear()
  })

  it('does not fire modals while stickers are loading (baseline race regression)', () => {
    // The bug: hook would seed with empty results during loading, then fire a
    // modal for every already-completed challenge on the next render.
    const c1 = challenge('kickoff')
    const c2 = challenge('halfway')

    const { result: hook, rerender } = renderHook(() => useChallengeCompletion('user-1'))
    expect(hook.current.activeCompletion).toBeNull()

    // Stickers finish loading and all challenges turn out to be complete.
    mockStatus = 'ready'
    mockResults = [result(c1, true), result(c2, true)]
    rerender()

    // No modal — the first ready render seeds the baseline silently.
    expect(hook.current.activeCompletion).toBeNull()
    expect(trackMock).not.toHaveBeenCalled()
  })

  it('fires a modal when a challenge transitions to completed after baseline', async () => {
    const c = challenge('kickoff')
    mockStatus = 'ready'
    mockResults = [result(c, false)]

    const { result: hook, rerender } = renderHook(() => useChallengeCompletion('user-1'))
    expect(hook.current.activeCompletion).toBeNull()

    mockResults = [result(c, true)]
    rerender()

    expect(hook.current.activeCompletion?.id).toBe('kickoff')
    expect(trackMock).toHaveBeenCalledWith('challenge_completed', expect.objectContaining({
      challenge_id: 'kickoff',
    }))
    expect(upsert).toHaveBeenCalledWith({ user_id: 'user-1', challenge_id: 'kickoff' })
  })

  it('queues multiple completions and dismiss advances the queue', () => {
    const c1 = challenge('kickoff')
    const c2 = challenge('halfway')
    mockStatus = 'ready'
    mockResults = [result(c1, false), result(c2, false)]

    const { result: hook, rerender } = renderHook(() => useChallengeCompletion('user-1'))

    mockResults = [result(c1, true), result(c2, true)]
    rerender()

    expect(hook.current.activeCompletion?.id).toBe('kickoff')
    act(() => hook.current.dismissCompletion())
    expect(hook.current.activeCompletion?.id).toBe('halfway')
    act(() => hook.current.dismissCompletion())
    expect(hook.current.activeCompletion).toBeNull()
  })

  it('persists completions to localStorage and skips them on re-render', () => {
    const c = challenge('kickoff')
    mockStatus = 'ready'
    mockResults = [result(c, false)]

    const { result: hook, rerender } = renderHook(() => useChallengeCompletion('user-1'))

    mockResults = [result(c, true)]
    rerender()

    expect(hook.current.activeCompletion?.id).toBe('kickoff')
    act(() => hook.current.dismissCompletion())

    // Same challenge still completed in a later render — must not re-fire.
    rerender()
    expect(hook.current.activeCompletion).toBeNull()
    expect(trackMock).toHaveBeenCalledTimes(1)
  })

  it('does not re-fire modals across reloads when challenge is already persisted', () => {
    localStorage.setItem(
      'challenge_completions_v1_user-1',
      JSON.stringify(['kickoff']),
    )
    const c = challenge('kickoff')
    mockStatus = 'ready'
    mockResults = [result(c, true)]

    const { result: hook } = renderHook(() => useChallengeCompletion('user-1'))
    expect(hook.current.activeCompletion).toBeNull()
    expect(trackMock).not.toHaveBeenCalled()
  })

  it('fires again after progressGeneration bump when local cache was cleared', () => {
    const c = challenge('kickoff')
    mockStatus = 'ready'
    mockResults = [result(c, false)]

    const { result: hook, rerender } = renderHook(() => useChallengeCompletion('user-1'))

    mockResults = [result(c, true)]
    rerender()
    expect(hook.current.activeCompletion?.id).toBe('kickoff')
    act(() => hook.current.dismissCompletion())

    localStorage.removeItem('challenge_completions_v1_user-1')
    mockProgressGeneration += 1
    mockResults = [result(c, false)]
    rerender()
    expect(hook.current.activeCompletion).toBeNull()

    mockResults = [result(c, true)]
    rerender()
    expect(hook.current.activeCompletion?.id).toBe('kickoff')
  })

  it('resets queue and baseline when userId changes', () => {
    const c = challenge('kickoff')
    mockStatus = 'ready'
    mockResults = [result(c, false)]

    const { result: hook, rerender } = renderHook(
      ({ id }: { id: string }) => useChallengeCompletion(id),
      { initialProps: { id: 'user-1' } },
    )

    mockResults = [result(c, true)]
    rerender({ id: 'user-1' })
    expect(hook.current.activeCompletion?.id).toBe('kickoff')

    // Switch user: queue clears, baseline reseeded silently.
    rerender({ id: 'user-2' })
    expect(hook.current.activeCompletion).toBeNull()
  })
})
