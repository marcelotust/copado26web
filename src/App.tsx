import { lazy, Suspense } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { useLocation } from 'react-router-dom'
import { useI18n } from './i18n'
import { hasPendingAuthCallback, isSupabaseAuthCallback, markAuthCallbackPending } from './lib/authRedirect'
import LoadingScreen from './components/LoadingScreen'
import ServerErrorPage from './pages/ServerErrorPage'

const AppAuthGate = lazy(() => import('./AppAuthGate'))
const LandingPage = lazy(() => import('./pages/LandingPage'))
const LegalPage = lazy(() => import('./pages/LegalPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

export default function App() {
  const { t } = useI18n()
  const { pathname, search, hash } = useLocation()
  const loadingScreen = <LoadingScreen label={t('loading')} />
  const isAuthCallback = isSupabaseAuthCallback(search, hash)
  if (isAuthCallback) markAuthCallbackPending()

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

  if (pathname === '/404') {
    return (
      <Suspense fallback={loadingScreen}>
        <NotFoundPage />
      </Suspense>
    )
  }
  if (pathname === '/500') {
    return <ServerErrorPage />
  }

  if (pathname === '/' && !isAuthCallback && !hasPendingAuthCallback()) {
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
      <AppAuthGate />
    </Suspense>
  )
}
