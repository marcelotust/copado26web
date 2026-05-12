// @ts-nocheck
import { useState } from 'react'
import { useI18n, LOCALE_META } from '../i18n/index.jsx'

export default function LoginPage({ onSendLink, onGoogleLogin, magicLinkSent, error }) {
  const { t, tRaw, locale, setLocale } = useI18n()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    const value = email.trim()
    if (!value) return
    setSubmittedEmail(value)
    setSending(true)
    await onSendLink(value)
    setSending(false)
  }

  const features = tRaw('login.features')

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4 py-10">

      {/* Card */}
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-br from-blue-700 to-blue-900 px-6 py-8 text-center">
          <div className="text-5xl mb-3">⚽</div>
          <h1 className="text-2xl font-bold text-white">Meu Album 2026</h1>
          <p className="text-blue-200 text-sm mt-1">{t('login.tagline')}</p>
        </div>

        {/* Features */}
        <div className="px-6 py-5 border-b border-slate-700">
          <p className="text-slate-400 text-sm mb-3">{t('login.description')}</p>
          <ul className="flex flex-col gap-2">
            {Array.isArray(features) && features.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-green-400 mt-0.5 shrink-0">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Form or sent state */}
        <div className="px-6 py-6">
          {magicLinkSent ? (
            <div className="flex flex-col items-center gap-4 text-center py-2">
              {/* Modern envelope icon */}
              <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{t('login.checkEmail')}</h2>
                <p className="text-slate-400 text-sm mt-1">
                  {t('login.linkSentTo')}{' '}
                  <span className="text-white font-medium">{submittedEmail}</span>
                </p>
              </div>
              <p className="text-slate-400 text-sm">{t('login.clickToSignIn')}</p>
              <p className="text-slate-500 text-xs">{t('login.linkExpires')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <button
                type="button"
                onClick={onGoogleLogin}
                className="flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-white hover:bg-gray-100 text-gray-800 font-semibold transition-colors"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {t('login.continueWithGoogle')}
              </button>

              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-slate-600" />
                <span className="text-slate-500 text-xs">{t('login.orEmail')}</span>
                <div className="flex-1 h-px bg-slate-600" />
              </div>

              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('login.emailPlaceholder')}
                className="px-4 py-3 rounded-lg bg-slate-700 text-white placeholder-slate-400 border border-slate-600 focus:outline-none focus:border-blue-500"
              />
              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}
              <button
                type="submit"
                disabled={sending}
                className="px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? t('login.sending') : t('login.sendLink')}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Language switcher — bottom */}
      <div className="flex gap-2 mt-6">
        {Object.entries(LOCALE_META).map(([key, { label, flag }]) => (
          <button
            key={key}
            onClick={() => setLocale(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
              ${locale === key
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            <span>{flag}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

    </div>
  )
}
