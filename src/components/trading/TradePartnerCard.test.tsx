import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../test/renderWithProviders'
import TradePartnerCard from './TradePartnerCard'
import type { TradePartner } from '../../hooks/useTradePartners'

vi.mock('../../lib/telemetry', () => ({
  AnalyticsEvent: { TRADE_PARTNER_SHARE: 'trade_partner_share' },
  telemetry: { track: vi.fn() },
}))

const partner: TradePartner = {
  user_id: 'u1', nickname: 'alice', display_name: 'Alice',
  avatar_url: null, completion_pct: 75, they_have_i_need: 15, i_have_they_need: 8,
}

describe('TradePartnerCard', () => {
  it('renders partner name and counters', () => {
    renderWithProviders(<TradePartnerCard partner={partner} shareText='share text' />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText(/15/)).toBeInTheDocument()
    expect(screen.getByText(/8/)).toBeInTheDocument()
  })

  it('share button uses clipboard fallback when Web Share unavailable', async () => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true })
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    })
    renderWithProviders(<TradePartnerCard partner={partner} shareText='share text' />)
    fireEvent.click(screen.getByRole('button', { name: /compartilh|share/i }))
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('share text')
    })
  })
})
