import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../test/renderWithProviders'
import RankingPage from './RankingPage'

vi.mock('../hooks/usePublicRanking', () => ({
  usePublicRanking: vi.fn().mockReturnValue({
    entries: [
      { user_id: 'u1', nickname: 'alice', display_name: 'Alice', avatar_url: null, owned_count: 900, completion_pct: 90.5, rank: 1 },
    ],
    loading: false,
    error: null,
  }),
}))

vi.mock('../hooks/useMyRank', () => ({
  useMyRank: vi.fn().mockReturnValue({ myRank: null, loading: false, error: null }),
}))

vi.mock('../state/friends', () => ({
  useProfile: vi.fn().mockReturnValue({
    profile: {
      user_id: 'u2', nickname: 'bob', display_name: 'Bob', avatar_url: null,
      collection_visibility: 'friends', ranking_public: true,
      trading_public: false, email_trade_optin: false, is_test_user: false,
    },
    loading: false, error: null,
  }),
  useFriends: vi.fn().mockReturnValue({ friends: [], loading: false, error: null }),
  useSentFriendRequests: vi.fn().mockReturnValue({ sentToIds: new Set(), loading: false }),
}))

vi.mock('../lib/supabase', () => ({ supabase: { rpc: vi.fn() } }))

vi.mock('../lib/telemetry', () => ({
  AnalyticsEvent: { RANKING_PAGE_VIEWED: 'ranking_page_viewed' },
  telemetry: { track: vi.fn() },
}))

describe('RankingPage', () => {
  it('renders the ranking list', async () => {
    renderWithProviders(<RankingPage userId='u2' />)
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument())
  })

  it('highlights current user row when user is in top 20', async () => {
    const { usePublicRanking } = await import('../hooks/usePublicRanking')
    vi.mocked(usePublicRanking).mockReturnValue({
      entries: [{ user_id: 'u2', nickname: 'bob', display_name: 'Bob', avatar_url: null, avatar_palette_id: null, owned_count: 800, completion_pct: 80.5, rank: 1 }],
      loading: false, error: null,
    })
    renderWithProviders(<RankingPage userId='u2' />)
    await waitFor(() => {
      const link = screen.getByRole('link', { name: /bob/i })
      expect(link.className).toContain('border-indigo-500')
    })
  })
})
