import { Analytics } from '@vercel/analytics/react'
import { useAuth } from './hooks/useAuth'
import { useI18n } from './i18n'
import { StickersProvider } from './state/stickersStore'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import LegalPage from './pages/LegalPage'
import LoadingScreen from './components/LoadingScreen'
import AuthenticatedApp from './AuthenticatedApp'

export default function App() {
  const { t } = useI18n()
  const { pathname } = useLocation()
  const { session, loading, magicLinkSent, error, sendMagicLink, signInWithGoogle, signOut } = useAuth()

  // Legal pages are always public regardless of auth state
  if (pathname === '/privacidade') return <LegalPage kind='privacy' />
  if (pathname === '/termos')      return <LegalPage kind='terms' />

  if (loading) return <LoadingScreen label={t('loading')} />

  if (!session) {
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
    <StickersProvider userId={session.user.id}>
      <AuthenticatedApp session={session} signOut={signOut} />
    </StickersProvider>
  )
}
