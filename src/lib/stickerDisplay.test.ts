import { describe, expect, it } from 'vitest'
import { displayTeamCode } from './stickerDisplay'

describe('displayTeamCode', () => {
  it('maps WAP to FWC for display', () => {
    expect(displayTeamCode('WAP')).toBe('FWC')
  })

  it('passes through all other team codes unchanged', () => {
    expect(displayTeamCode('BRA')).toBe('BRA')
    expect(displayTeamCode('FWC')).toBe('FWC')
    expect(displayTeamCode('CC')).toBe('CC')
    expect(displayTeamCode('ESP')).toBe('ESP')
  })
})
