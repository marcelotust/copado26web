import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { I18nProvider } from '../i18n'
import { FeedbackProvider } from '../contexts/FeedbackContext'
import SettingsExportSection from './SettingsExportSection'

const mockFeedback = {
  show: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  dismiss: vi.fn(),
}

vi.mock('../contexts/FeedbackContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../contexts/FeedbackContext')>()
  return {
    ...actual,
    useFeedback: () => mockFeedback,
  }
})

vi.mock('../state/stickersStore', () => ({
  useCatalogSnapshot: () => ({ catalog: [], quantities: new Map() }),
}))

vi.mock('../lib/albumCsv', () => ({
  buildAlbumCsv: vi.fn(() => {
    throw new Error('export boom')
  }),
}))

function renderSection() {
  return render(
    <I18nProvider>
      <FeedbackProvider>
        <SettingsExportSection />
      </FeedbackProvider>
    </I18nProvider>,
  )
}

describe('SettingsExportSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows feedback error when export fails', async () => {
    const user = userEvent.setup()
    renderSection()
    await user.click(screen.getByRole('button', { name: /exportar|export/i }))
    expect(mockFeedback.error).toHaveBeenCalledWith('feedback.exportFailed')
  })
})
