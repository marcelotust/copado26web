import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n, LOCALE_META, type Locale } from '../i18n'
import BrandMark from '../components/brand/BrandMark'
import LoginMagicLinkPanel from '../components/LoginMagicLinkPanel'
import LoginEmailForm from '../components/LoginEmailForm'

const LoginBackgroundMosaic = lazy(() => import('../components/LoginBackgroundMosaic'))

type LoginPageProps = {
  onSendLink: (email: string) => Promise<void>
  onGoogleLogin: () => Promise<void>
  magicLinkSent: boolean
  errorKey: string | null
}

export default function LoginPage({ onSendLink, onGoogleLogin, magicLinkSent, errorKey }: LoginPageProps) {
  const { t, tRaw, locale, setLocale } = useI18n()
  const [submittedEmail, setSubmittedEmail] = useState('')

  async function handleSendLink(value: string) {
    setSubmittedEmail(value)
    await onSendLink(value)
  }

  const features = tRaw('login.features')

  return (
    <div className='relative min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 py-10 overflow-hidden'>
      <Suspense fallback={null}>
        <LoginBackgroundMosaic />
      </Suspense>

      <div className='relative z-10 w-full max-w-md bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden'>
        <div
          className='px-6 py-10 text-center flex flex-col items-center gap-3'
          style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1a1a2e 60%, #0d2818 100%)' }}
        >
          <BrandMark variant='card' className='h-20 w-20' />
          <BrandMark className='h-6 w-auto opacity-90' />
          <p className='text-blue-200/80 text-sm max-w-xs leading-relaxed'>{t('login.tagline')}</p>
        </div>

        <div className='px-6 py-5 border-b border-slate-700'>
          <p className='text-slate-400 text-sm mb-3'>{t('login.description')}</p>
          <ul className='flex flex-col gap-2'>
            {Array.isArray(features) && features.map((f: string) => (
              <li key={f} className='flex items-start gap-2 text-sm text-slate-300'>
                <span className='text-green-400 mt-0.5 shrink-0'>✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className='px-6 py-6'>
          {magicLinkSent
            ? <LoginMagicLinkPanel email={submittedEmail} />
            : <LoginEmailForm onSendLink={handleSendLink} onGoogleLogin={onGoogleLogin} errorKey={errorKey} />}
        </div>
      </div>

      <Link to='/' className='relative z-10 mt-4 text-xs text-slate-600 hover:text-slate-400 transition-colors'>
        ← Voltar
      </Link>

      <div className='relative z-10 flex gap-2 mt-3'>
        {Object.entries(LOCALE_META).map(([key, { label, flag }]) => (
          <button
            key={key}
            onClick={() => setLocale(key as Locale)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              locale === key ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <span>{flag}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
