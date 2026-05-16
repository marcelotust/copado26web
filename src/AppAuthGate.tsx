import { lazy, Suspense } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { useLocation, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useI18n } from './i18n'
import { AUTH_POST_LOGIN_PATH_KEY } from './lib/tradeAuthStorage'
import { clearAuthCallbackPending, consumePostLoginPath } from './lib/authRedirect'
import LoadingScreen from './components/LoadingScreen'

const AuthenticatedApp = lazy(() => import('./AuthenticatedApp'))
const GuestAlbumPage = lazy(() => import('./pages/GuestAlbumPage'))
const LandingPage = lazy(() => import('./pages/LandingPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const StickersProviderBoundary = lazy(() => import('./state/StickersProviderBoundary'))
const TradePage = lazy(() => import('./pages/TradePage'))

export default function AppAuthGate() {
  const { t } = useI18n()
  const { pathname } = useLocation()
  const { session, loading, magicLinkSent, errorKey, sendMagicLink, signInWithGoogle, signOut } = useAuth()
  const loadingScreen = <LoadingScreen label={t('loading')} />

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

  if (session && (pathname === '/' || pathname === '/login')) {
    clearAuthCallbackPending()
    return <Navigate to={consumePostLoginPath(AUTH_POST_LOGIN_PATH_KEY)} replace />
  }

  if (session) {
    clearAuthCallbackPending()
  }

  if (!session) {
    clearAuthCallbackPending()
    if (pathname === '/login') {
      return (
        <>
          {/* Anonymous visitors: cookie-less, no PII - no consent required */}
          <Analytics />
          <Suspense fallback={loadingScreen}>
            <LoginPage
              onSendLink={sendMagicLink}
              onGoogleLogin={signInWithGoogle}
              magicLinkSent={magicLinkSent}
              errorKey={errorKey}
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
