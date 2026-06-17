import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../test/renderWithProviders'
import TradingPartnersPage from './TradingPartnersPage'

vi.mock('../lib/supabase', () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}))

vi.mock('../hooks/useTradePartners', () => ({
  useTradePartners: vi.fn().mockReturnValue({
    partners: [
      { user_id: 'u1', nickname: 'alice', display_name: 'Alice', avatar_url: null,
        completion_pct: 75, they_have_i_need: 15, i_have_they_need: 8 },
    ],
    loading: false, error: null,
  }),
}))

vi.mock('../state/friends', () => ({
  useProfile: vi.fn().mockReturnValue({
    profile: {
      user_id: 'u2', nickname: 'bob', display_name: 'Bob', avatar_url: null,
      avatar_palette_id: null, collection_visibility: 'friends', ranking_public: false,
      trading_public: true, email_trade_optin: false, is_test_user: false,
    },
    loading: false, error: null,
    refetch: vi.fn(), setNickname: vi.fn(), updateDisplayName: vi.fn(),
    updateVisibility: vi.fn(), updateSharingSettings: vi.fn(), updateAvatarPalette: vi.fn(),
  }),
}))

vi.mock('../lib/telemetry', () => ({
  AnalyticsEvent: {
    TRADING_PARTNERS_PAGE_VIEWED: 'trading_partners_page_viewed',
    TRADE_FAIR_FILTER_TOGGLED: 'trade_fair_filter_toggled',
  },
  telemetry: { track: vi.fn() },
}))

vi.mock('../state/stickersStore', () => ({
  useStickersContext: vi.fn().mockReturnValue({ catalog: new Map(), teams: [] }),
}))

describe('TradingPartnersPage', () => {
  it('renders partner cards', async () => {
    renderWithProviders(<TradingPartnersPage userId='u2' />)
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument())
  })

  it('shows not-opted-in card when trading_public is false', async () => {
    const { useProfile } = await import('../state/friends')
    vi.mocked(useProfile).mockReturnValueOnce({
      profile: {
        user_id: 'u2', nickname: 'bob', display_name: 'Bob', avatar_url: null,
        avatar_palette_id: null, collection_visibility: 'friends', ranking_public: false,
        trading_public: false, email_trade_optin: false, is_test_user: false,
      },
      loading: false, error: null,
      refetch: vi.fn(), setNickname: vi.fn(), updateDisplayName: vi.fn(),
      updateVisibility: vi.fn(), updateSharingSettings: vi.fn(), updateAvatarPalette: vi.fn(),
    })
    renderWithProviders(<TradingPartnersPage userId='u2' />)
    await waitFor(() => expect(screen.getByRole('link', { name: /ativar|enable/i })).toBeInTheDocument())
  })
})
