import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '../i18n'
import ConsentBanner from './ConsentBanner'

function renderBanner(props: { onAccept: () => void; onDecline: () => void }) {
  return render(
    <MemoryRouter>
      <I18nProvider>
        <ConsentBanner {...props} />
      </I18nProvider>
    </MemoryRouter>,
  )
}

describe('ConsentBanner', () => {
  it('calls onAccept when user accepts', async () => {
    const user = userEvent.setup()
    const onAccept = vi.fn()
    const onDecline = vi.fn()
    renderBanner({ onAccept, onDecline })
    await user.click(screen.getByRole('button', { name: /aceitar|accept|activar/i }))
    expect(onAccept).toHaveBeenCalledOnce()
    expect(onDecline).not.toHaveBeenCalled()
  })

  it('calls onDecline when user declines', async () => {
    const user = userEvent.setup()
    const onAccept = vi.fn()
    const onDecline = vi.fn()
    renderBanner({ onAccept, onDecline })
    await user.click(screen.getByRole('button', { name: /recusar|decline|rechazar/i }))
    expect(onDecline).toHaveBeenCalledOnce()
    expect(onAccept).not.toHaveBeenCalled()
  })
})
