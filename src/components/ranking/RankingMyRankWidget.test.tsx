import { beforeEach, describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { persistLocale } from '../../i18n/localeData'
import { renderWithProviders } from '../../test/renderWithProviders'
import RankingMyRankWidget from './RankingMyRankWidget'

describe('RankingMyRankWidget', () => {
  beforeEach(() => {
    persistLocale('pt-BR')
  })

  it('shows rank and link when user is ranked', () => {
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

  it('shows dimmed state with settings link when not opted in', () => {
    renderWithProviders(
      <RankingMyRankWidget
        myRank={null}
        rankingPublic={false}
        loading={false}
      />
    )
    expect(screen.getByRole('link', { name: /configura/i })).toBeInTheDocument()
  })

  it('shows skeleton when loading', () => {
    const { container } = renderWithProviders(
      <RankingMyRankWidget myRank={null} rankingPublic={false} loading={true} />
    )
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })
})
