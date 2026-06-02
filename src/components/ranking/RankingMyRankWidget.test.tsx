import { beforeEach, describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { persistLocale } from '../../i18n/localeData'
import { renderWithProviders } from '../../test/renderWithProviders'
import RankingMyRankWidget from './RankingMyRankWidget'

describe('RankingMyRankWidget', () => {
  beforeEach(() => {
    persistLocale('pt-BR')
  })

  it('shows rank prominently when user is ranked', () => {
    renderWithProviders(
      <RankingMyRankWidget
        myRank={{ rank: 12, owned_count: 744, completion_pct: 74.8 }}
        rankingPublic={true}
        loading={false}
      />
    )
    expect(screen.getByText('#12')).toBeInTheDocument()
    expect(screen.getByText(/74\.8%/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ranking/i })).toBeInTheDocument()
  })

  it('shows not-opted-in card when ranking_public is false', () => {
    renderWithProviders(
      <RankingMyRankWidget
        myRank={null}
        rankingPublic={false}
        loading={false}
      />
    )
    expect(screen.getByRole('link', { name: /configura/i })).toBeInTheDocument()
  })

  it('shows empty state when opted in but no rank yet', () => {
    renderWithProviders(
      <RankingMyRankWidget
        myRank={null}
        rankingPublic={true}
        loading={false}
      />
    )
    expect(screen.getByText(/participando/i)).toBeInTheDocument()
  })

  it('shows skeleton when loading', () => {
    const { container } = renderWithProviders(
      <RankingMyRankWidget myRank={null} rankingPublic={false} loading={true} />
    )
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('filters current user from top3 list', () => {
    const top3 = [
      { user_id: 'me', nickname: 'me', display_name: 'Me', avatar_url: null, owned_count: 900, completion_pct: 90.5, rank: 1 },
      { user_id: 'other', nickname: 'other', display_name: 'Other', avatar_url: null, owned_count: 800, completion_pct: 80.5, rank: 2 },
    ]
    renderWithProviders(
      <RankingMyRankWidget
        myRank={{ rank: 1, owned_count: 900, completion_pct: 90.5 }}
        rankingPublic={true}
        loading={false}
        top3={top3}
        currentUserId='me'
      />
    )
    expect(screen.queryByText('Me')).not.toBeInTheDocument()
    expect(screen.getByText('Other')).toBeInTheDocument()
    expect(screen.getByText('🥇')).toBeInTheDocument()
  })
})
