import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import Header from './Header'

// Mock subcomponents with external dependencies
vi.mock('./HeaderMenu', () => ({ default: () => <div data-testid='header-menu' /> }))
vi.mock('./TradeQRModal', () => ({ default: () => null }))
vi.mock('./brand/BrandMark', () => ({ default: () => <span>Logo</span> }))
vi.mock('./FatProgressBar', () => ({ default: () => <div /> }))
vi.mock('./friends/FriendsHeaderButton', () => ({ default: () => null }))
vi.mock('../state/stickersStore', () => ({
  useAlbumProgress: () => ({ total: 100, collected: 42, swaps: 0 }),
}))
vi.mock('../i18n', () => ({ useI18n: () => ({ t: (k: string) => k }) }))

function renderHeader(showRankingBadge: boolean) {
  return render(
    <MemoryRouter>
      <Header onLogout={() => {}} showRankingBadge={showRankingBadge} />
    </MemoryRouter>
  )
}

describe('Header ranking badge', () => {
  it('shows red dot when showRankingBadge is true', () => {
    renderHeader(true)
    expect(screen.getByTestId('ranking-badge')).toBeInTheDocument()
  })

  it('hides red dot when showRankingBadge is false', () => {
    renderHeader(false)
    expect(screen.queryByTestId('ranking-badge')).not.toBeInTheDocument()
  })
})
