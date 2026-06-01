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

  it('expands to show sticker lists on click', async () => {
    renderWithProviders(<TradePartnerCard partner={partner} currentNickname='me' />)
    fireEvent.click(screen.getByRole('button', { name: /ver listas|see lists/i }))
    await waitFor(() => {
      expect(screen.getByText(/BRA-01/)).toBeInTheDocument()
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
    await waitFor(() => screen.getByText(/BRA-01/))
    fireEvent.click(screen.getByRole('button', { name: /compartilh|share/i }))
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled()
    })
  })
})
