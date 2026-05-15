import { useState } from 'react'
import { useI18n } from '../i18n'
import { useResetAlbum } from '../state/stickersStore'
import ConfirmModal from './ConfirmModal'
import { telemetry } from '../lib/telemetry'

export default function SettingsDangerZone() {
  const { t } = useI18n()
  const resetAlbum = useResetAlbum()
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetDone, setResetDone] = useState(false)

  async function handleReset() {
    setResetting(true)
    try {
      await resetAlbum()
      telemetry.track('album_reset')
      setResetDone(true)
      setShowResetConfirm(false)
      setTimeout(() => setResetDone(false), 3000)
    } catch (err) {
      console.error('Reset failed:', err)
    } finally {
      setResetting(false)
    }
  }

  return (
    <section className='flex flex-col gap-2'>
      <h2 className='text-sm font-semibold text-slate-400 uppercase tracking-wide'>
        {t('settings.dangerZone')}
      </h2>
      <button
        onClick={() => setShowResetConfirm(true)}
        className='px-4 py-3 rounded-lg bg-red-900/40 hover:bg-red-900/60 text-red-400 text-left border border-red-800 transition-colors'
      >
        {t('settings.resetAlbum')}
      </button>
      {resetDone && <p className='text-green-400 text-sm'>{t('settings.resetDone')}</p>}

      <ConfirmModal
        isOpen={showResetConfirm}
        title={t('settings.resetConfirmTitle')}
        description={t('settings.resetConfirmDesc')}
        confirmLabel={resetting ? t('settings.resetting') : t('settings.resetConfirmYes')}
        cancelLabel={t('settings.resetConfirmNo')}
        onConfirm={handleReset}
        onCancel={() => setShowResetConfirm(false)}
        loading={resetting}
      />
    </section>
  )
}
