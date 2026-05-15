import { useState, type FormEvent } from 'react'
import { useI18n } from '../i18n'
import GoogleIcon from './GoogleIcon'
import { AnalyticsEvent, telemetry } from '../lib/telemetry'
import { detectLocale } from '../i18n/localeData'

type LoginEmailFormProps = {
  onSendLink: (email: string) => Promise<void>
  onGoogleLogin: () => Promise<void>
  errorKey: string | null
}

export default function LoginEmailForm({ onSendLink, onGoogleLogin, errorKey }: LoginEmailFormProps) {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const value = email.trim()
    if (!value) return
    telemetry.track(AnalyticsEvent.AUTH_MAGIC_LINK_REQUESTED, { locale: detectLocale() })
    setSending(true)
    await onSendLink(value)
    setSending(false)
  }

  async function handleGoogleLogin() {
    telemetry.track(AnalyticsEvent.AUTH_GOOGLE_STARTED, { locale: detectLocale() })
    setGoogleLoading(true)
    try {
      await onGoogleLogin()
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-3'>
      <button
        type='button'
        onClick={handleGoogleLogin}
        disabled={googleLoading || sending}
        className='flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-white hover:bg-gray-100 text-gray-800 font-semibold transition-colors disabled:opacity-50'
      >
        <GoogleIcon />
        {googleLoading ? t('login.signingIn') : t('login.continueWithGoogle')}
      </button>

      <div className='flex items-center gap-3 my-1'>
        <div className='flex-1 h-px bg-slate-600' />
        <span className='text-slate-500 text-xs'>{t('login.orEmail')}</span>
        <div className='flex-1 h-px bg-slate-600' />
      </div>

      <input
        type='email'
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t('login.emailPlaceholder')}
        className='px-4 py-3 rounded-lg bg-slate-700 text-white placeholder-slate-400 border border-slate-600 focus:outline-none focus:border-blue-500'
      />
      {errorKey && <p className='text-red-400 text-sm text-center' role='alert'>{t(errorKey)}</p>}
      <button
        type='submit'
        disabled={sending}
        className='px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
      >
        {sending ? t('login.sending') : t('login.sendLink')}
      </button>
    </form>
  )
}
