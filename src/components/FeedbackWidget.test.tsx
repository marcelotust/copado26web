import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { persistLocale } from '../i18n/localeData'
import { renderWithProviders } from '../test/renderWithProviders'
import { AnalyticsEvent, telemetry } from '../lib/telemetry'
import FeedbackWidget, { buildFeedbackMailto } from './FeedbackWidget'

vi.mock('../lib/telemetry', async () => {
  const actual = await vi.importActual<typeof import('../lib/telemetry')>('../lib/telemetry')
  return {
    ...actual,
    telemetry: {
      ...actual.telemetry,
      track: vi.fn(),
    },
  }
})

describe('FeedbackWidget', () => {
  beforeEach(() => {
    persistLocale('en')
    vi.clearAllMocks()
  })

  it('builds a support mailto link with subject and body only', () => {
    const href = buildFeedbackMailto({
      email: 'support@example.test',
      subject: 'Feature idea',
      body: 'Describe it here',
    })

    expect(href).toBe('mailto:support@example.test?subject=Feature+idea&body=Describe+it+here')
  })

  it('opens and closes the dialog with focus returned to the button', async () => {
    const user = userEvent.setup()
    renderWithProviders(<FeedbackWidget />)

    const button = screen.getByRole('button', { name: /send feedback/i })
    await user.click(button)

    expect(screen.getByRole('dialog', { name: /talk to us/i })).toBeInTheDocument()
    expect(telemetry.track).toHaveBeenCalledWith(
      AnalyticsEvent.FEEDBACK_WIDGET_OPENED,
      { result: 'opened' },
    )

    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(button).toHaveFocus()
  })

  it('renders the three category mailto actions', async () => {
    const user = userEvent.setup()
    renderWithProviders(<FeedbackWidget />)

    await user.click(screen.getByRole('button', { name: /send feedback/i }))

    const feature = screen.getByRole('link', { name: /suggest feature/i })
    const bug = screen.getByRole('link', { name: /report bug/i })
    const comment = screen.getByRole('link', { name: /send comment/i })

    expect(feature.getAttribute('href')).toContain('mailto:hello@copa26web.app?')
    expect(feature.getAttribute('href')).toContain('subject=%5BMy+Album+2026%5D+Feature+suggestion')
    expect(bug.getAttribute('href')).toContain('subject=%5BMy+Album+2026%5D+Bug+report')
    expect(comment.getAttribute('href')).toContain('subject=%5BMy+Album+2026%5D+Comment')
  })

  it('tracks only safe category and result props when a category is selected', async () => {
    const user = userEvent.setup()
    renderWithProviders(<FeedbackWidget />)

    await user.click(screen.getByRole('button', { name: /send feedback/i }))
    const bug = screen.getByRole('link', { name: /report bug/i })
    bug.addEventListener('click', (event) => event.preventDefault())
    await user.click(bug)

    expect(telemetry.track).toHaveBeenCalledWith(
      AnalyticsEvent.FEEDBACK_WIDGET_SUBMITTED,
      { category: 'bug', result: 'mailto_started' },
    )
    expect(screen.getByText(/opening your email app/i)).toBeInTheDocument()
  })
})
