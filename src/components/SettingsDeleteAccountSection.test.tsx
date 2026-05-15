import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { I18nProvider } from '../i18n'
import { persistLocale } from '../i18n/localeData'
import { FeedbackProvider } from '../contexts/FeedbackContext'
import SettingsDeleteAccountSection from './SettingsDeleteAccountSection'

const deleteMyAccountRpc = vi.fn()
const onDeleted = vi.fn()

vi.mock('../lib/audit', () => ({
  deleteMyAccountRpc: (...args: unknown[]) => deleteMyAccountRpc(...args),
}))

vi.mock('../lib/logger', () => ({
  reportError: vi.fn(),
  errorCodeFrom: () => 'unknown',
}))

vi.mock('../lib/telemetry', () => ({
  AnalyticsEvent: { ACCOUNT_DELETION_COMPLETED: 'account_deletion_completed' },
  telemetry: { track: vi.fn() },
}))

function renderSection() {
  return render(
    <I18nProvider>
      <FeedbackProvider>
        <SettingsDeleteAccountSection email='user@test.com' onDeleted={onDeleted} />
      </FeedbackProvider>
    </I18nProvider>,
  )
}

describe('SettingsDeleteAccountSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    persistLocale('pt-BR')
    deleteMyAccountRpc.mockResolvedValue(undefined)
    onDeleted.mockResolvedValue(undefined)
  })

  it('requires confirmation phrase before delete', async () => {
    const user = userEvent.setup()
    renderSection()
    await user.click(screen.getByRole('button', { name: /excluir minha conta|delete my account/i }))
    const confirm = screen.getByRole('button', { name: /sim, excluir|yes, delete/i })
    expect(confirm).toBeDisabled()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'EXCLUIR' } })
    await waitFor(() => expect(confirm).not.toBeDisabled())
    await user.click(confirm)
    expect(deleteMyAccountRpc).toHaveBeenCalledOnce()
    expect(onDeleted).toHaveBeenCalledOnce()
  })
})
