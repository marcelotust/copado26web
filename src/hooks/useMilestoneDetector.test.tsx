import { renderHook, act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Team } from '../types/database'

const teams: Team[] = [
  { code: 'BRA', name_key: 'team.bra', flag: '🇧🇷', conf: 'CONMEBOL', group_letter: null, sort_order: 0 },
  { code: 'ARG', name_key: 'team.arg', flag: '🇦🇷', conf: 'CONMEBOL', group_letter: null, sort_order: 1 },
]

const ctxState = {
  status: 'loading' as 'loading' | 'ready',
  progressGeneration: 0,
  byTeam: new Map<string, string[]>([
    ['BRA', ['BRA-01', 'BRA-02']],
    ['ARG', ['ARG-01']],
  ]),
  quantities: new Map<string, number>(),
}
const albumState = { collected: 0, total: 1000 }

vi.mock('../state/StickersProvider', () => ({
  useStickersContext: () => ({ ...ctxState, teams }),
}))
vi.mock('../state/stickersStore', () => ({
  useAlbumProgress: () => albumState,
}))

import { useMilestoneDetector } from './useMilestoneDetector'

const t = (k: string) => k

describe('useMilestoneDetector', () => {
  beforeEach(() => {
    localStorage.clear()
    ctxState.status = 'loading'
    ctxState.progressGeneration = 0
    ctxState.quantities = new Map()
    albumState.collected = 0
    albumState.total = 1000
  })

  it('returns no milestone while stickers are loading', () => {
    const { result } = renderHook(() => useMilestoneDetector({ userId: 'u1', t }))
    expect(result.current.activeMilestone).toBeNull()
    expect(result.current.earnedMilestones).toEqual([])
  })

  it('seeds baseline silently the first time status becomes ready', () => {
    albumState.collected = 600 // already past 25% and 50%
    ctxState.status = 'ready'
    const { result } = renderHook(() => useMilestoneDetector({ userId: 'u1', t }))
    expect(result.current.activeMilestone).toBeNull()
  })

  it('fires an album milestone after baseline when threshold is crossed', () => {
    ctxState.status = 'ready'
    albumState.collected = 240

    const { result, rerender } = renderHook(() => useMilestoneDetector({ userId: 'u1', t }))
    expect(result.current.activeMilestone).toBeNull() // baseline seed

    albumState.collected = 260
    rerender()
    expect(result.current.activeMilestone).toEqual({ kind: 'album', pct: 25 })
  })

  it('dismissMilestone advances the queue', () => {
    ctxState.status = 'ready'
    albumState.total = 100
    albumState.collected = 0
    ctxState.quantities = new Map()

    const { result, rerender } = renderHook(() => useMilestoneDetector({ userId: 'u1', t }))

    // Cross 25% and complete BRA at the same time.
    albumState.collected = 30
    ctxState.quantities = new Map([['BRA-01', 1], ['BRA-02', 1]])
    rerender()

    expect(result.current.activeMilestone).toMatchObject({ kind: 'album', pct: 25 })
    act(() => result.current.dismissMilestone())
    expect(result.current.activeMilestone).toMatchObject({ kind: 'team', teamCode: 'BRA' })
    act(() => result.current.dismissMilestone())
    expect(result.current.activeMilestone).toBeNull()
  })

  it('showMilestone front-loads a milestone and deduplicates', () => {
    ctxState.status = 'ready'

    const { result } = renderHook(() => useMilestoneDetector({ userId: 'u1', t }))

    act(() => result.current.showMilestone({ kind: 'album', pct: 25 }))
    expect(result.current.activeMilestone).toEqual({ kind: 'album', pct: 25 })

    // Same key → no duplicate.
    act(() => result.current.showMilestone({ kind: 'album', pct: 25 }))
    act(() => result.current.dismissMilestone())
    expect(result.current.activeMilestone).toBeNull()
  })

  it('allows milestones to fire again after progressGeneration bump (album reset)', () => {
    ctxState.status = 'ready'
    albumState.total = 100
    albumState.collected = 0

    const { result, rerender } = renderHook(() => useMilestoneDetector({ userId: 'u1', t }))
    rerender() // baseline at 0%

    albumState.collected = 30
    rerender()
    expect(result.current.activeMilestone).toEqual({ kind: 'album', pct: 25 })
    act(() => result.current.dismissMilestone())

    localStorage.removeItem('meualbum2026.milestones.v1:u1')
    ctxState.progressGeneration += 1
    albumState.collected = 0
    act(() => { rerender() })
    expect(result.current.activeMilestone).toBeNull()

    albumState.collected = 30
    act(() => { rerender() })
    expect(result.current.activeMilestone).toEqual({ kind: 'album', pct: 25 })
  })

  it('earnedMilestones hydrates persisted entries in reverse chronological order', () => {
    localStorage.setItem(
      'meualbum2026.milestones.v1:u1',
      JSON.stringify({
        v: 1,
        events: [
          { kind: 'album', pct: 25, at: 1 },
          { kind: 'team', teamCode: 'BRA', at: 2 },
        ],
      }),
    )
    ctxState.status = 'ready'
    const { result } = renderHook(() => useMilestoneDetector({ userId: 'u1', t }))
    expect(result.current.earnedMilestones).toHaveLength(2)
    // Newest first.
    expect(result.current.earnedMilestones[0]).toMatchObject({ kind: 'team', teamCode: 'BRA' })
    expect(result.current.earnedMilestones[1]).toMatchObject({ kind: 'album', pct: 25 })
  })
})
