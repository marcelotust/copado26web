import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../test/renderWithProviders'
import TradePartnerCard from './TradePartnerCard'
import type { TradePartner } from '../../hooks/useTradePartners'

vi.mock('../../lib/telemetry', () => ({
  AnalyticsEvent: { TRADE_PARTNER_SHARE: 'trade_partner_share' },
  telemetry: { track: vi.fn() },
}))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({
      data: { they_have_i_need: ['BRA-01', 'ARG-02'], i_have_they_need: ['GER-03'] },
      error: null,
    }),
  },
}))

vi.mock('../../state/stickersStore', () => ({
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

const partner: TradePartner = {
  user_id: 'u1', nickname: 'alice', display_name: 'Alice',
  avatar_url: null, completion_pct: 75, they_have_i_need: 15, i_have_they_need: 8,
}

describe('TradePartnerCard', () => {
  it('renders partner name and counters', () => {
    renderWithProviders(<TradePartnerCard partner={partner} currentNickname='me' />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText(/15/)).toBeInTheDocument()
    expect(screen.getByText(/8/)).toBeInTheDocument()
  })

  it('expands to show sticker lists grouped by team', async () => {
    renderWithProviders(<TradePartnerCard partner={partner} currentNickname='me' />)
    fireEvent.click(screen.getByRole('button', { name: /ver listas|see lists/i }))
    await waitFor(() => {
      expect(screen.getByText('BRA')).toBeInTheDocument()
      expect(screen.getByText('ARG')).toBeInTheDocument()
    })
  })

  it('share button uses clipboard fallback when Web Share unavailable', async () => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true })
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    })
    renderWithProviders(<TradePartnerCard partner={partner} currentNickname='me' />)
    // expand to reveal share buttons
    fireEvent.click(screen.getByRole('button', { name: /ver listas|see lists/i }))
    await waitFor(() => screen.getByText('BRA'))
    fireEvent.click(screen.getByRole('button', { name: /compartilh|share/i }))
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled()
    })
  })
})
