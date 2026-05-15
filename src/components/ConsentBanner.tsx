import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { telemetry } from '../lib/telemetry'

type Props = {
  onAccept: () => void
  onDecline: () => void
}

export default function ConsentBanner({ onAccept, onDecline }: Props) {
  const { t } = useI18n()

  function handleAccept() {
    onAccept()
    telemetry.track('analytics_consent_granted')
  }

  function handleDecline() {
    telemetry.track('analytics_consent_declined')
    onDecline()
  }

  return (
    <div
      role='dialog'
      aria-label={t('consent.label')}
      className='fixed bottom-0 left-0 right-0 z-[90] border-t border-slate-700 bg-slate-900/95 backdrop-blur-sm px-4 py-3 sm:px-6'
    >
      <div className='max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3'>
        <p className='flex-1 text-xs text-slate-400 leading-relaxed'>
          {t('consent.message')}{' '}
          <Link
            to='/privacidade'
            className='text-slate-300 underline underline-offset-2 hover:text-white transition-colors'
          >
            {t('consent.learnMore')}
          </Link>
          .
        </p>
        <div className='flex items-center gap-2 shrink-0'>
          <button
            type='button'
            onClick={handleDecline}
            className='px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors'
          >
            {t('consent.decline')}
          </button>
          <button
            type='button'
            onClick={handleAccept}
            className='px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white transition-colors'
          >
            {t('consent.accept')}
          </button>
        </div>
      </div>
    </div>
  )
}
