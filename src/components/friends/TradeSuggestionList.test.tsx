import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../test/renderWithProviders'
import TradeSuggestionList from './TradeSuggestionList'

vi.mock('../../state/friends', () => ({
  useTradeSuggestions: vi.fn().mockReturnValue({
    data: {
      ok: true,
      they_have_i_need: ['BRA-01', 'ARG-02'],
      i_have_they_need: ['GER-03'],
    },
    loading: false,
    error: null,
  }),
}))

vi.mock('../../state/StickersProvider', () => ({
  useStickersContext: vi.fn().mockReturnValue({
    catalog: new Map([
      ['BRA-01', { id: 'BRA-01', team_code: 'BRA', number: 1, player_name: null, is_special: false, sort_order: 1 }],
      ['ARG-02', { id: 'ARG-02', team_code: 'ARG', number: 2, player_name: null, is_special: false, sort_order: 2 }],
      ['GER-03', { id: 'GER-03', team_code: 'GER', number: 3, player_name: null, is_special: false, sort_order: 3 }],
    ]),
    teams: [
      { code: 'ARG', name_key: 'team.arg', flag: '🇦🇷', conf: 'CONMEBOL', group_letter: 'C', sort_order: 1 },
      { code: 'BRA', name_key: 'team.bra', flag: '🇧🇷', conf: 'CONMEBOL', group_letter: 'C', sort_order: 2 },
      { code: 'GER', name_key: 'team.ger', flag: '🇩🇪', conf: 'UEFA', group_letter: 'D', sort_order: 3 },
    ],
  }),
}))

describe('TradeSuggestionList', () => {
  it('renders both sections with counts and grouped team rows', () => {
    renderWithProviders(<TradeSuggestionList friendUserId='u1' />)
    // copy varies by locale; assert the counts ("2" and "1") appear in the headers
    expect(screen.getByText(/\b2\b/)).toBeInTheDocument()
    expect(screen.getByText(/\b1\b/)).toBeInTheDocument()
    expect(screen.getByText('BRA')).toBeInTheDocument()
    expect(screen.getByText('ARG')).toBeInTheDocument()
    expect(screen.getByText('GER')).toBeInTheDocument()
  })
})
