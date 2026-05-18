import { useState, lazy, Suspense } from 'react'
import BrandMark from './brand/BrandMark'
import LoginEmailForm from './LoginEmailForm'
import LoginMagicLinkPanel from './LoginMagicLinkPanel'
import { AUTH_POST_LOGIN_PATH_KEY } from '../lib/tradeAuthStorage'
import { AnalyticsEvent, telemetry } from '../lib/telemetry'
import { useAuth } from '../hooks/useAuth'
import { useI18n } from '../i18n'

const LoginBackgroundMosaic = lazy(() => import('./LoginBackgroundMosaic'))

type Props = { onClose: () => void }

export default function GuestPaywallModal({ onClose }: Props) {
  const { t } = useI18n()
  const { sendMagicLink, signInWithGoogle, magicLinkSent, errorKey } = useAuth()
  const [submittedEmail, setSubmittedEmail] = useState('')

  async function handleSendLink(email: string) {
    try { sessionStorage.setItem(AUTH_POST_LOGIN_PATH_KEY, '/album') } catch { /* private mode */ }
    setSubmittedEmail(email)
    await sendMagicLink(email)
  }

  async function handleGoogleLogin() {
    try { sessionStorage.setItem(AUTH_POST_LOGIN_PATH_KEY, '/album') } catch { /* private mode */ }
    await signInWithGoogle()
  }

  function handleDismiss() {
    telemetry.track(AnalyticsEvent.PAYWALL_DISMISSED)
    onClose()
  }

  return (
    <div
      className='fixed inset-0 z-50 flex items-end'
      role='dialog'
      aria-modal='true'
      aria-labelledby='paywall-heading'
    >
      <div
        className='absolute inset-0 bg-black/70 backdrop-blur-sm'
        onClick={!magicLinkSent ? handleDismiss : undefined}
        aria-hidden='true'
      />

      <div className='relative w-full flex flex-col rounded-t-3xl overflow-hidden shadow-2xl' style={{ maxHeight: '78dvh' }}>

        <div className='relative h-40 shrink-0 overflow-hidden flex flex-col items-center justify-center'>
          <Suspense fallback={null}>
            <LoginBackgroundMosaic />
          </Suspense>
          <div className='absolute inset-0 bg-gradient-to-b from-slate-950/75 via-slate-950/50 to-slate-800' />
          <div className='relative z-10 flex flex-col items-center gap-1.5 px-6 text-center'>
            <div className='w-10 h-1 rounded-full bg-white/25 mb-2' aria-hidden='true' />
            <BrandMark className='h-10 w-auto' />
            <p className='text-blue-200/90 text-xs max-w-xs leading-relaxed' id='paywall-heading'>
              {t('guest.paywall.tagline')}
            </p>
          </div>
        </div>

        <div className='bg-slate-800 px-6 pt-5 pb-8 overflow-y-auto'>
          <div className='mx-auto w-full max-w-md flex flex-col gap-4'>
            {magicLinkSent
              ? <LoginMagicLinkPanel email={submittedEmail} />
              : (
                <LoginEmailForm
                  onSendLink={handleSendLink}
                  onGoogleLogin={handleGoogleLogin}
                  errorKey={errorKey}
                />
              )
            }
            {!magicLinkSent && (
              <button
                onClick={handleDismiss}
                className='text-slate-500 hover:text-slate-300 text-sm transition-colors text-center'
              >
                {t('guest.paywall.dismiss')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
