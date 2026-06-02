import { beforeEach, describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { persistLocale } from '../../i18n/localeData'
import { renderWithProviders } from '../../test/renderWithProviders'
import RankingMyRankWidget from './RankingMyRankWidget'

describe('RankingMyRankWidget', () => {
  beforeEach(() => {
    persistLocale('pt-BR')
  })

  it('shows skeleton when loading', () => {
    const { container } = renderWithProviders(
      <RankingMyRankWidget myRank={null} rankingPublic={false} loading={true} />
    )
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows not-opted-in card when ranking_public is false', () => {
    renderWithProviders(
      <RankingMyRankWidget myRank={null} rankingPublic={false} loading={false} />
    )
    expect(screen.getByRole('link', { name: /configura/i })).toBeInTheDocument()
    expect(screen.getByText(/não está participando/i)).toBeInTheDocument()
  })

  it('shows empty state when opted in but no rank yet', () => {
    renderWithProviders(
      <RankingMyRankWidget myRank={null} rankingPublic={true} loading={false} />
    )
    expect(screen.getByText(/nenhum/i)).toBeInTheDocument()
  })

  it('shows rank and link when user is ranked outside top 3', () => {
    renderWithProviders(
      <RankingMyRankWidget
        myRank={{ rank: 12, owned_count: 744, completion_pct: 74.8 }}
        rankingPublic={true}
        loading={false}
      />
    )
    expect(screen.getByText('#12')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ranking/i })).toBeInTheDocument()
  })

  it('shows ordinal for top 3 and general position text', () => {
    renderWithProviders(
      <RankingMyRankWidget
        myRank={{ rank: 3, owned_count: 860, completion_pct: 86 }}
        rankingPublic={true}
        loading={false}
      />
    )
    expect(screen.getByText('3ª')).toBeInTheDocument()
    expect(screen.getByText(/no ranking geral/i)).toBeInTheDocument()
  })

  it('shows CTA button linking to /ranking when ranked', () => {
    renderWithProviders(
      <RankingMyRankWidget
        myRank={{ rank: 5, owned_count: 700, completion_pct: 70 }}
        rankingPublic={true}
        loading={false}
      />
    )
    const cta = screen.getByRole('link', { name: /ver ranking completo/i })
    expect(cta).toHaveAttribute('href', '/ranking')
  })

  it('shows medal emoji for top 3 positions', () => {
    const { rerender } = renderWithProviders(
      <RankingMyRankWidget
        myRank={{ rank: 1, owned_count: 900, completion_pct: 90 }}
        rankingPublic={true}
        loading={false}
      />
    )
    expect(screen.getByText('🥇')).toBeInTheDocument()

    rerender(
      <RankingMyRankWidget
        myRank={{ rank: 2, owned_count: 880, completion_pct: 88 }}
        rankingPublic={true}
        loading={false}
      />
    )
    expect(screen.getByText('🥈')).toBeInTheDocument()

    rerender(
      <RankingMyRankWidget
        myRank={{ rank: 3, owned_count: 860, completion_pct: 86 }}
        rankingPublic={true}
        loading={false}
      />
    )
    expect(screen.getByText('🥉')).toBeInTheDocument()
  })
})
