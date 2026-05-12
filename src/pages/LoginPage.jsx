// @ts-nocheck
import { useState } from 'react'
import { useI18n, LOCALE_META } from '../i18n/index.jsx'

export default function LoginPage({ onSendLink, magicLinkSent, error }) {
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
          <h1 className="text-2xl font-bold text-white">WC 2026 Album</h1>
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
            <div className="flex flex-col items-center gap-3 text-center py-2">
              <div className="text-4xl">📬</div>
              <h2 className="text-lg font-bold text-white">{t('login.checkEmail')}</h2>
              <p className="text-slate-400 text-sm">
                {t('login.linkSentTo')}{' '}
                <span className="text-white font-medium">{submittedEmail}</span>.{' '}
                {t('login.clickToSignIn')}
              </p>
              <p className="text-slate-500 text-xs">{t('login.linkExpires')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
