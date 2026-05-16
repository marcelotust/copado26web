import { beforeEach, describe, expect, it } from 'vitest'
import {
  __resetAnonExperimentForTests,
  getAnonId,
  getAnonVariant,
} from './anonExperiment'

describe('anonExperiment', () => {
  beforeEach(() => {
    __resetAnonExperimentForTests()
  })

  it('persists a stable anon id across calls', () => {
    const first = getAnonId()
    const second = getAnonId()
    expect(first).toBe(second)
    expect(first.length).toBeGreaterThan(8)
  })

  it('returns the same variant for the same anon id on repeated calls', () => {
    const a = getAnonVariant('exp_foo', { variants: ['control', 'treatment'] })
    const b = getAnonVariant('exp_foo', { variants: ['control', 'treatment'] })
    expect(a).toBe(b)
  })

  it('splits a population roughly 50/50 across many anon ids', () => {
    let control = 0
    let treatment = 0
    // Simulate 2_000 different anonymous users by reseeding between calls.
    for (let i = 0; i < 2_000; i++) {
      __resetAnonExperimentForTests()
      const v = getAnonVariant('exp_hero', { variants: ['control', 'treatment'] })
      if (v === 'control') control++
      else treatment++
    }
    // Allow ±3% slack — FNV-1a is well-distributed but not crypto-uniform.
    const ratio = control / 2_000
    expect(ratio).toBeGreaterThan(0.45)
    expect(ratio).toBeLessThan(0.55)
    expect(control + treatment).toBe(2_000)
  })

  it('respects custom weights', () => {
    let control = 0
    let treatment = 0
    for (let i = 0; i < 2_000; i++) {
      __resetAnonExperimentForTests()
      const v = getAnonVariant('exp_skewed', {
        variants: ['control', 'treatment'],
        weights: [9, 1],
      })
      if (v === 'control') control++
      else treatment++
    }
    const controlRatio = control / 2_000
    expect(controlRatio).toBeGreaterThan(0.85)
    expect(controlRatio).toBeLessThan(0.95)
    expect(control + treatment).toBe(2_000)
  })
})
