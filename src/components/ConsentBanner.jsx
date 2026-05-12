import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { setAnalyticsConsent } from '../lib/consent'
import { trackProductEvent } from '../lib/analytics'

/** @param {{ onChange: (granted: boolean) => void }} props */
export default function ConsentBanner({ onChange }) {
  const { t } = useI18n()
  const [visible, setVisible] = useState(true)

  function choose(granted) {
    setAnalyticsConsent(granted)
    onChange(granted)
    if (granted) {
      trackProductEvent('consent_analytics_updated', { granted: true })
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className='fixed inset-x-0 bottom-0 z-[70] border-t border-slate-800 bg-slate-950/95 p-4 backdrop-blur'>
      <div className='mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <p className='text-sm text-slate-300'>
          {t('consent.analyticsMessage')}{' '}
          <Link to='/privacidade' className='text-sky-400 underline-offset-2 hover:underline'>
            {t('consent.privacyLink')}
          </Link>
        </p>
        <div className='flex gap-2'>
          <button
            type='button'
            onClick={() => choose(false)}
            className='rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-800'
          >
            {t('consent.reject')}
          </button>
          <button
            type='button'
            onClick={() => choose(true)}
            className='rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-500'
          >
            {t('consent.accept')}
          </button>
        </div>
      </div>
    </div>
  )
}
