import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from './i18n'
import { AUTH_CALLBACK_PENDING_KEY } from './lib/authRedirect'
import App from './App'

vi.mock('@vercel/analytics/react', () => ({
  Analytics: () => null,
}))

vi.mock('./components/LoadingScreen', () => ({
  default: () => <div>loading</div>,
}))

vi.mock('./AppAuthGate', () => ({
  default: () => <div>auth gate</div>,
}))

vi.mock('./pages/LandingPage', () => ({
  default: () => <div>landing page</div>,
}))

vi.mock('./pages/LegalPage', () => ({
  default: () => <div>legal page</div>,
}))

function renderApp(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <I18nProvider>
        <App />
      </I18nProvider>
    </MemoryRouter>,
  )
}

describe('App auth callback routing', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('routes Supabase callbacks through the auth gate instead of the landing page', async () => {
    renderApp('/?code=abc')

    expect(await screen.findByText('auth gate')).toBeInTheDocument()
    expect(screen.queryByText('landing page')).not.toBeInTheDocument()
    expect(sessionStorage.getItem(AUTH_CALLBACK_PENDING_KEY)).toBe('1')
  })

  it('keeps the auth gate mounted after Supabase removes callback parameters', async () => {
    sessionStorage.setItem(AUTH_CALLBACK_PENDING_KEY, '1')
    renderApp('/')

    expect(await screen.findByText('auth gate')).toBeInTheDocument()
    expect(screen.queryByText('landing page')).not.toBeInTheDocument()
  })
})
