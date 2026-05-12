import { describe, expect, it } from 'vitest'
import { teamColor, teamColors } from './utils'

describe('teamColors', () => {
  it('returns known kit colors for a team code', () => {
    expect(teamColors('BRA')).toEqual({ primary: '#009C3B', secondary: '#FFDF00' })
  })

  it('falls back to slate colors for unknown codes', () => {
    expect(teamColors('ZZZ')).toEqual({ primary: '#334155', secondary: '#64748b' })
  })
})

describe('teamColor', () => {
  it('returns a stable palette entry for the same code', () => {
    expect(teamColor('ARG')).toBe(teamColor('ARG'))
  })
})
