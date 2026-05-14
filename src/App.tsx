import { Analytics } from '@vercel/analytics/react'
import { useLocation, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useI18n } from './i18n'
import { AUTH_POST_LOGIN_PATH_KEY } from './lib/tradePayload'
import { StickersProvider } from './state/stickersStore'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import LegalPage from './pages/LegalPage'
import TradePage from './pages/TradePage'
import LoadingScreen from './components/LoadingScreen'
import AuthenticatedApp from './AuthenticatedApp'

export default function App() {
  const { t } = useI18n()
  const { pathname } = useLocation()
  const { session, loading, magicLinkSent, error, sendMagicLink, signInWithGoogle, signOut } = useAuth()

  // Legal pages are always public regardless of auth state
  if (pathname === '/privacidade') return <LegalPage kind='privacy' />
  if (pathname === '/termos')      return <LegalPage kind='terms' />

  if (pathname.startsWith('/trade')) {
    if (loading) return <LoadingScreen label={t('loading')} />
    if (!session) {
      return (
        <>
          <Analytics />
          <TradePage session={null} />
        </>
      )
    }
    return (
      <StickersProvider userId={session.user.id}>
        <TradePage session={session} />
      </StickersProvider>
    )
  }

  if (loading) return <LoadingScreen label={t('loading')} />

  if (session && pathname === '/login') {
    try {
      const raw = sessionStorage.getItem(AUTH_POST_LOGIN_PATH_KEY)
      if (raw?.startsWith('/trade')) {
        sessionStorage.removeItem(AUTH_POST_LOGIN_PATH_KEY)
        return <Navigate to={raw} replace />
      }
    } catch {
      /* private mode */
    }
  }

  if (!session) {
    if (pathname === '/login') {
      return (
        <>
          {/* Anonymous visitors: cookie-less, no PII — no consent required */}
          <Analytics />
          <LoginPage
            onSendLink={sendMagicLink}
            onGoogleLogin={signInWithGoogle}
            magicLinkSent={magicLinkSent}
            error={error}
          />
        </>
      )
    }
    return (
      <>
        <Analytics />
        <LandingPage />
      </>
    )
  }

  return (
    <StickersProvider userId={session.user.id}>
      <AuthenticatedApp session={session} signOut={signOut} />
    </StickersProvider>
  )
}
