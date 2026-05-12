import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { I18nProvider } from '../i18n'
import { FeedbackProvider, useFeedback } from './FeedbackProvider'

function Probe() {
  const { push } = useFeedback()
  return (
    <button type='button' onClick={() => push('Saved', { variant: 'success' })}>
      Show toast
    </button>
  )
}

describe('FeedbackProvider', () => {
  it('renders a toast when push is called', async () => {
    const user = userEvent.setup()

    render(
      <I18nProvider>
        <FeedbackProvider>
          <Probe />
        </FeedbackProvider>
      </I18nProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Show toast' }))
    expect(screen.getByText('Saved')).toBeInTheDocument()
  })
})
