import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '../../test/renderWithProviders'
import DataSharingConsentModal from './DataSharingConsentModal'

vi.mock('../../lib/telemetry', () => ({
  AnalyticsEvent: {
    DATA_SHARING_CONSENT_MODAL_SHOWN: 'data_sharing_consent_modal_shown',
    DATA_SHARING_CONSENT_MODAL_TO_SETTINGS: 'data_sharing_consent_modal_to_settings',
  },
  telemetry: { track: vi.fn() },
}))

describe('DataSharingConsentModal', () => {
  it('renders modal content', () => {
    renderWithProviders(
      <DataSharingConsentModal onDismiss={vi.fn()} onGoToSettings={vi.fn()} />
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('calls onDismiss when dismiss button clicked', () => {
    const onDismiss = vi.fn()
    renderWithProviders(
      <DataSharingConsentModal onDismiss={onDismiss} onGoToSettings={vi.fn()} />
    )
    fireEvent.click(screen.getByTestId('consent-dismiss'))
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('calls onGoToSettings and onDismiss when CTA clicked', () => {
    const onGoToSettings = vi.fn()
    const onDismiss = vi.fn()
    renderWithProviders(
      <DataSharingConsentModal onDismiss={onDismiss} onGoToSettings={onGoToSettings} />
    )
    fireEvent.click(screen.getByTestId('consent-cta'))
    expect(onGoToSettings).toHaveBeenCalledOnce()
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
