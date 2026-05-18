import { describe, expect, it } from 'vitest'
import { cBlue, cMint, cRose, ink, ink2, paper, tokens } from './tokens'

describe('tokens', () => {
  it('exports locked palette A hex values', () => {
    expect(ink).toBe('#0F172A')
    expect(ink2).toBe('#1A2236')
    expect(paper).toBe('#F6F4EF')
    expect(cBlue).toBe('#5B8DEF')
    expect(cRose).toBe('#EC5B87')
    expect(cMint).toBe('#3EC48A')
  })

  it('groups tokens in a const object', () => {
    expect(tokens).toEqual({
      ink: '#0F172A',
      ink2: '#1A2236',
      paper: '#F6F4EF',
      cBlue: '#5B8DEF',
      cRose: '#EC5B87',
      cMint: '#3EC48A',
    })
  })
})
