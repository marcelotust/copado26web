import { lazy, Suspense } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { useLocation, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useI18n } from './i18n'
import { AUTH_POST_LOGIN_PATH_KEY } from './lib/tradeAuthStorage'
import LoadingScreen from './components/LoadingScreen'

const AuthenticatedApp = lazy(() => import('./AuthenticatedApp'))
const GuestAlbumPage = lazy(() => import('./pages/GuestAlbumPage'))
const LandingPage = lazy(() => import('./pages/LandingPage'))
const LegalPage = lazy(() => import('./pages/LegalPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const StickersProviderBoundary = lazy(() => import('./state/StickersProviderBoundary'))
const TradePage = lazy(() => import('./pages/TradePage'))

export default function App() {
  const { t } = useI18n()
  const { pathname } = useLocation()
  const { session, loading, magicLinkSent, error, sendMagicLink, signInWithGoogle, signOut } = useAuth()
  const loadingScreen = <LoadingScreen label={t('loading')} />

  // Legal pages are always public regardless of auth state
  if (pathname === '/privacidade') {
    return (
      <Suspense fallback={loadingScreen}>
        <LegalPage kind='privacy' />
      </Suspense>
    )
  }
  if (pathname === '/termos') {
    return (
      <Suspense fallback={loadingScreen}>
        <LegalPage kind='terms' />
      </Suspense>
    )
  }

  if (pathname === '/album' && !session) {
    if (loading) return loadingScreen
    return (
      <>
        <Analytics />
        <Suspense fallback={loadingScreen}>
          <GuestAlbumPage />
        </Suspense>
      </>
    )
  }

  if (pathname.startsWith('/trade')) {
    if (loading) return loadingScreen
    if (!session) {
      return (
        <>
          <Analytics />
          <Suspense fallback={loadingScreen}>
            <TradePage session={null} />
          </Suspense>
        </>
      )
    }
    return (
      <Suspense fallback={loadingScreen}>
        <StickersProviderBoundary userId={session.user.id}>
          <TradePage session={session} />
        </StickersProviderBoundary>
      </Suspense>
    )
  }

  if (loading) return loadingScreen

  if (session && pathname === '/login') {
    try {
      const raw = sessionStorage.getItem(AUTH_POST_LOGIN_PATH_KEY)
      if (raw?.startsWith('/trade') || raw?.startsWith('/album')) {
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
          <Suspense fallback={loadingScreen}>
            <LoginPage
              onSendLink={sendMagicLink}
              onGoogleLogin={signInWithGoogle}
              magicLinkSent={magicLinkSent}
              error={error}
            />
          </Suspense>
        </>
      )
    }
    return (
      <>
        <Analytics />
        <Suspense fallback={loadingScreen}>
          <LandingPage />
        </Suspense>
      </>
    )
  }

  return (
    <Suspense fallback={loadingScreen}>
      <StickersProviderBoundary userId={session.user.id}>
        <AuthenticatedApp session={session} signOut={signOut} />
      </StickersProviderBoundary>
    </Suspense>
  )
}
