import { lazy, Suspense } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { useLocation } from 'react-router-dom'
import { useI18n } from './i18n'
import LoadingScreen from './components/LoadingScreen'

const AppAuthGate = lazy(() => import('./AppAuthGate'))
const LandingPage = lazy(() => import('./pages/LandingPage'))
const LegalPage = lazy(() => import('./pages/LegalPage'))

function isSupabaseAuthCallback(search: string, hash: string): boolean {
  const params = new URLSearchParams(search)
  if (params.has('code') || params.has('error_code')) return true
  return hash.includes('access_token=') || hash.includes('refresh_token=') || hash.includes('error_code=')
}

export default function App() {
  const { t } = useI18n()
  const { pathname, search, hash } = useLocation()
  const loadingScreen = <LoadingScreen label={t('loading')} />

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

  if (pathname === '/' && !isSupabaseAuthCallback(search, hash)) {
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
