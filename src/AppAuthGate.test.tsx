import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, useLocation } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { I18nProvider } from './i18n'
import { AUTH_CALLBACK_PENDING_KEY } from './lib/authRedirect'
import { AUTH_POST_LOGIN_PATH_KEY } from './lib/tradeAuthStorage'
import AppAuthGate from './AppAuthGate'

const { useAuthMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
}))

vi.mock('@vercel/analytics/react', () => ({
  Analytics: () => null,
}))

vi.mock('./hooks/useAuth', () => ({
  useAuth: useAuthMock,
}))

vi.mock('./components/LoadingScreen', () => ({
  default: () => <div>loading</div>,
}))

function LocationProbe() {
  const location = useLocation()
  return <div data-testid='pathname'>{location.pathname}</div>
}

const session = {
  user: {
    id: 'user-1',
    email: 'user@example.com',
    app_metadata: {},
    created_at: '2026-05-16T12:00:00.000Z',
  },
} as Session

function renderGate(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <I18nProvider>
        <AppAuthGate />
        <LocationProbe />
      </I18nProvider>
    </MemoryRouter>,
  )
}

describe('AppAuthGate post-login redirects', () => {
  beforeEach(() => {
    sessionStorage.clear()
    useAuthMock.mockReturnValue({
      session,
      loading: false,
      magicLinkSent: false,
      errorKey: null,
      sendMagicLink: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
    })
  })

  it('sends authenticated callbacks at the root to the dashboard', async () => {
    sessionStorage.setItem(AUTH_CALLBACK_PENDING_KEY, '1')
    renderGate('/')

    await waitFor(() => expect(screen.getByTestId('pathname')).toHaveTextContent('/dashboard'))
    expect(sessionStorage.getItem(AUTH_CALLBACK_PENDING_KEY)).toBeNull()
  })

  it('honors an internal return path captured before login', async () => {
    sessionStorage.setItem(AUTH_POST_LOGIN_PATH_KEY, '/album')
    renderGate('/login')

    await waitFor(() => expect(screen.getByTestId('pathname')).toHaveTextContent('/album'))
    expect(sessionStorage.getItem(AUTH_POST_LOGIN_PATH_KEY)).toBeNull()
  })
})
