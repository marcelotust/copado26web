import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { persistLocale } from '../../i18n/localeData'
import { renderWithProviders } from '../../test/renderWithProviders'
import RankingRow from './RankingRow'
import type { RankingEntry } from '../../hooks/usePublicRanking'

const entry: RankingEntry = {
  user_id: 'u1',
  nickname: 'alice',
  display_name: 'Alice',
  avatar_url: null,
  avatar_palette_id: null,
  owned_count: 900,
  completion_pct: 90.5,
  rank: 1,
}

describe('RankingRow', () => {
  beforeEach(() => {
    persistLocale('pt-BR')
  })

  it('renders name and progress', () => {
    renderWithProviders(<RankingRow entry={entry} isCurrentUser={false} friendStatus='none' />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('@alice')).toBeInTheDocument()
  })

  it('shows Add Friend button when friendStatus is none and not current user', () => {
    renderWithProviders(<RankingRow entry={entry} isCurrentUser={false} friendStatus='none' />)
    expect(screen.getByRole('button', { name: /amigo/i })).toBeInTheDocument()
  })

  it('hides Add Friend button for current user even if friendStatus is none', () => {
    renderWithProviders(<RankingRow entry={entry} isCurrentUser={true} friendStatus='none' />)
    expect(screen.queryByRole('button', { name: /amigo/i })).not.toBeInTheDocument()
  })

  it('shows pending indicator when friendStatus is pending', () => {
    renderWithProviders(<RankingRow entry={entry} isCurrentUser={false} friendStatus='pending' />)
    expect(screen.getByLabelText(/enviado/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /amigo/i })).not.toBeInTheDocument()
  })

  it('shows no CTA when friendStatus is friend', () => {
    renderWithProviders(<RankingRow entry={entry} isCurrentUser={false} friendStatus='friend' />)
    expect(screen.queryByRole('button', { name: /amigo/i })).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/enviado/i)).not.toBeInTheDocument()
  })

  it('calls onSendRequest and stops navigation on button click', () => {
    const onSend = vi.fn()
    renderWithProviders(<RankingRow entry={entry} isCurrentUser={false} friendStatus='none' onSendRequest={onSend} />)
    const btn = screen.getByRole('button', { name: /amigo/i })
    fireEvent.click(btn)
    expect(onSend).toHaveBeenCalledTimes(1)
  })

  it('disables button while sending', () => {
    renderWithProviders(<RankingRow entry={entry} isCurrentUser={false} friendStatus='none' sending={true} />)
    expect(screen.getByRole('button', { name: /amigo/i })).toBeDisabled()
  })
})
