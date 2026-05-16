import { beforeEach, describe, expect, it } from 'vitest'
import {
  __resetQueueForTests,
  drainQueuedEvents,
  queueingAnalytics,
} from './queue'

describe('queueingAnalytics', () => {
  beforeEach(() => {
    __resetQueueForTests()
  })

  it('captures events with a timestamp in insertion order', () => {
    queueingAnalytics.track('a', { i: 1 })
    queueingAnalytics.track('b', { i: 2 })
    queueingAnalytics.track('c')
    const drained = drainQueuedEvents()
    expect(drained.map((e) => e.event)).toEqual(['a', 'b', 'c'])
    expect(drained[0].props).toEqual({ i: 1 })
    expect(drained[2].props).toBeUndefined()
    for (const e of drained) {
      expect(typeof e.timestamp).toBe('number')
      expect(e.timestamp).toBeGreaterThan(0)
    }
  })

  it('drain clears the buffer (replay-safe)', () => {
    queueingAnalytics.track('a')
    queueingAnalytics.track('b')
    expect(drainQueuedEvents()).toHaveLength(2)
    expect(drainQueuedEvents()).toHaveLength(0)
  })

  it('caps the buffer and drops the oldest entries past the limit', () => {
    // 200 is the cap (see queue.ts MAX_QUEUE_SIZE).
    for (let i = 0; i < 205; i++) {
      queueingAnalytics.track(`evt_${i}`)
    }
    const drained = drainQueuedEvents()
    expect(drained).toHaveLength(200)
    // Oldest 5 events were shifted out; first surviving event is evt_5.
    expect(drained[0].event).toBe('evt_5')
    expect(drained[drained.length - 1].event).toBe('evt_204')
  })

  it('flag/variant/onFeatureFlags are inert noops', () => {
    expect(queueingAnalytics.flag('any')).toBe(false)
    expect(queueingAnalytics.variant('any')).toBeNull()
    const unsubscribe = queueingAnalytics.onFeatureFlags(() => {})
    expect(typeof unsubscribe).toBe('function')
    unsubscribe()
  })

  it('reset() empties the buffer without returning anything', () => {
    queueingAnalytics.track('a')
    queueingAnalytics.reset()
    expect(drainQueuedEvents()).toHaveLength(0)
  })
})
