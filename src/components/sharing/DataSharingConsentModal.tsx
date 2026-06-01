import { createPortal } from 'react-dom'
import { useEffect } from 'react'
import { useI18n } from '../../i18n'
import { AnalyticsEvent, telemetry } from '../../lib/telemetry'

type Props = {
  onDismiss: () => void
  onGoToSettings: () => void
}

export default function DataSharingConsentModal({ onDismiss, onGoToSettings }: Props) {
  const { t } = useI18n()

  useEffect(() => {
    telemetry.track(AnalyticsEvent.DATA_SHARING_CONSENT_MODAL_SHOWN)
  }, [])

  function handleCta() {
    telemetry.track(AnalyticsEvent.DATA_SHARING_CONSENT_MODAL_TO_SETTINGS)
    onGoToSettings()
    onDismiss()
  }

  return createPortal(
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4'
      role='dialog'
      aria-modal='true'
    >
      <div className='absolute inset-0 bg-black/60 backdrop-blur-sm' aria-hidden />
      <div className='relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 flex flex-col gap-4'>
        <h2 className='text-white font-bold text-base'>
          {t('sharing.consentModalTitle')}
        </h2>
        <p className='text-slate-400 text-sm leading-relaxed'>
          {t('sharing.consentModalBody')}
        </p>
        <div className='flex flex-col gap-2'>
          <button
            type='button'
            data-testid='consent-cta'
            onClick={handleCta}
            className='w-full px-4 py-2.5 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors'
          >
            {t('sharing.consentModalCta')}
          </button>
          <button
            type='button'
            data-testid='consent-dismiss'
            onClick={onDismiss}
            className='w-full px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white transition-colors'
          >
            {t('sharing.consentModalDismiss')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
