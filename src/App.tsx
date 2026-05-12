import { useAuth } from './hooks/useAuth'
import { useI18n } from './i18n'
import { StickersProvider } from './state/stickersStore'
import LoginPage from './pages/LoginPage'
import LoadingScreen from './components/LoadingScreen'
import AuthenticatedApp from './AuthenticatedApp'

export default function App() {
  const { t } = useI18n()
  const { session, loading, magicLinkSent, error, sendMagicLink, signInWithGoogle, signOut } = useAuth()

  if (loading) return <LoadingScreen label={t('loading')} />

  if (!session) {
    return (
      <LoginPage
        onSendLink={sendMagicLink}
        onGoogleLogin={signInWithGoogle}
        magicLinkSent={magicLinkSent}
        error={error}
      />
    )
  }

  return (
    <StickersProvider userId={session.user.id}>
      <AuthenticatedApp session={session} signOut={signOut} />
    </StickersProvider>
  )
}
