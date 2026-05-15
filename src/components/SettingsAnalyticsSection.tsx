import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import type { ConsentState } from '../hooks/useAnalyticsConsent'

type Props = {
  consent: ConsentState
  onGrant: () => void
  onDecline: () => void
}

export default function SettingsAnalyticsSection({ consent, onGrant, onDecline }: Props) {
  const { t } = useI18n()

  const statusLabel = consent === 'granted'
    ? t('settings.analyticsStatusOn')
    : consent === 'declined'
      ? t('settings.analyticsStatusOff')
      : t('settings.analyticsStatusPending')

  return (
    <section className='flex flex-col gap-2'>
      <h2 className='text-sm font-semibold text-slate-400 uppercase tracking-wide'>
        {t('settings.privacy')}
      </h2>
      <div className='px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 flex flex-col gap-3'>
        <p className='text-sm text-slate-300 leading-relaxed'>
          {t('settings.analyticsDescription')}{' '}
          <Link to='/privacidade' className='text-slate-200 underline underline-offset-2 hover:text-white'>
            {t('consent.learnMore')}
          </Link>
          .
        </p>
        <p className='text-xs text-slate-500'>{t('settings.analyticsPageviewsNote')}</p>
        <p className='text-sm font-medium text-white'>{statusLabel}</p>
        <div className='flex flex-wrap gap-2'>
          {consent !== 'granted' && (
            <button
              type='button'
              onClick={onGrant}
              className='px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white transition-colors'
            >
              {t('settings.analyticsEnable')}
            </button>
          )}
          {consent === 'granted' && (
            <button
              type='button'
              onClick={onDecline}
              className='px-4 py-2 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-white transition-colors'
            >
              {t('settings.analyticsDisable')}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
