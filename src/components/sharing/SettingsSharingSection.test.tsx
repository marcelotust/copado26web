import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../test/renderWithProviders'
import SettingsSharingSection from './SettingsSharingSection'
import type { Profile } from '../../state/friends/types'

const baseProfile: Profile = {
  user_id: 'u1',
  nickname: 'joao',
  display_name: 'João',
  avatar_url: null,
  collection_visibility: 'friends',
  ranking_public: false,
  trading_public: false,
  email_trade_optin: false,
  is_test_user: false,
}

describe('SettingsSharingSection', () => {
  it('renders all 3 toggles unchecked when profile has all false', () => {
    renderWithProviders(
      <SettingsSharingSection profile={baseProfile} onUpdate={vi.fn()} />
    )
    const checkboxes = screen.getAllByRole('switch')
    expect(checkboxes).toHaveLength(3)
    checkboxes.forEach(cb => expect(cb).not.toBeChecked())
  })

  it('renders ranking toggle checked when ranking_public is true', () => {
    renderWithProviders(
      <SettingsSharingSection
        profile={{ ...baseProfile, ranking_public: true }}
        onUpdate={vi.fn()}
      />
    )
    const [rankingCb] = screen.getAllByRole('switch')
    expect(rankingCb).toBeChecked()
  })

  it('calls onUpdate with inverted ranking_public when toggle clicked', async () => {
    const onUpdate = vi.fn().mockResolvedValue({ ok: true })
    renderWithProviders(
      <SettingsSharingSection profile={baseProfile} onUpdate={onUpdate} />
    )
    const [rankingCb] = screen.getAllByRole('switch')
    fireEvent.click(rankingCb)
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith({ ranking_public: true })
    })
  })

  it('does not render when profile is null', () => {
    const { container } = renderWithProviders(
      <SettingsSharingSection profile={null} onUpdate={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })
})
