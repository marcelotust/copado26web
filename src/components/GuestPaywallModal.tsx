import { useState, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLogo from './AppLogo'
import LoginEmailForm from './LoginEmailForm'
import LoginMagicLinkPanel from './LoginMagicLinkPanel'
import { AUTH_POST_LOGIN_PATH_KEY } from '../lib/tradeAuthStorage'
import { AnalyticsEvent, telemetry } from '../lib/telemetry'
import { useAuth } from '../hooks/useAuth'

const LoginBackgroundMosaic = lazy(() => import('./LoginBackgroundMosaic'))

type Props = { onClose: () => void }

export default function GuestPaywallModal({ onClose }: Props) {
  const { sendMagicLink, signInWithGoogle, magicLinkSent, error } = useAuth()
  const [submittedEmail, setSubmittedEmail] = useState('')
  const navigate = useNavigate()

  async function handleSendLink(email: string) {
    try { sessionStorage.setItem(AUTH_POST_LOGIN_PATH_KEY, '/album') } catch { /* private mode */ }
    setSubmittedEmail(email)
    await sendMagicLink(email)
  }

  async function handleGoogleLogin() {
    try { sessionStorage.setItem(AUTH_POST_LOGIN_PATH_KEY, '/album') } catch { /* private mode */ }
    await signInWithGoogle()
    navigate('/login')
  }

  function handleDismiss() {
    telemetry.track(AnalyticsEvent.PAYWALL_DISMISSED)
    onClose()
  }

  return (
    <div
      className='fixed inset-0 z-50 flex items-end justify-center'
      role='dialog'
      aria-modal='true'
      aria-labelledby='paywall-heading'
    >
      <div
        className='absolute inset-0 bg-black/70 backdrop-blur-sm'
        onClick={!magicLinkSent ? handleDismiss : undefined}
        aria-hidden='true'
      />

      <div className='relative w-full max-w-lg flex flex-col rounded-t-3xl overflow-hidden shadow-2xl' style={{ maxHeight: '78dvh' }}>

        <div className='relative h-40 shrink-0 overflow-hidden flex flex-col items-center justify-center'>
          <Suspense fallback={null}>
            <LoginBackgroundMosaic />
          </Suspense>
          <div className='absolute inset-0 bg-gradient-to-b from-slate-950/75 via-slate-950/50 to-slate-800' />
          <div className='relative z-10 flex flex-col items-center gap-1.5 px-6 text-center'>
            <div className='w-10 h-1 rounded-full bg-white/25 mb-2' aria-hidden='true' />
            <AppLogo size='md' />
            <p className='text-blue-200/90 text-xs max-w-xs leading-relaxed' id='paywall-heading'>
              Seu assistente para completar o maior álbum da Copa do Mundo
            </p>
          </div>
        </div>

        <div className='bg-slate-800 px-6 pt-5 pb-8 flex flex-col gap-4 overflow-y-auto'>
          {magicLinkSent
            ? <LoginMagicLinkPanel email={submittedEmail} />
            : (
              <LoginEmailForm
                onSendLink={handleSendLink}
                onGoogleLogin={handleGoogleLogin}
                error={error}
              />
            )
          }
          {!magicLinkSent && (
            <button
              onClick={handleDismiss}
              className='text-slate-500 hover:text-slate-300 text-sm transition-colors text-center'
            >
              Agora não
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
