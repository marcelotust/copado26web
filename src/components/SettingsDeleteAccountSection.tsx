import { useState } from 'react'
import { useI18n } from '../i18n'
import { useFeedback } from '../contexts/FeedbackContext'
import { deleteMyAccountRpc } from '../lib/audit'
import { errorCodeFrom, reportError } from '../lib/logger'
import { AnalyticsEvent, telemetry } from '../lib/telemetry'
import ConfirmModal from './ConfirmModal'

type Props = {
  email?: string
  onDeleted: () => void | Promise<void>
}

export default function SettingsDeleteAccountSection({ email, onDeleted }: Props) {
  const { t } = useI18n()
  const feedback = useFeedback()
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const requiredPhrase = t('settings.deleteAccountConfirmPhrase')
  const canConfirm = confirmText.trim() === requiredPhrase

  async function handleDelete() {
    if (!canConfirm) return
    setDeleting(true)
    try {
      await deleteMyAccountRpc()
      telemetry.track(AnalyticsEvent.ACCOUNT_DELETION_COMPLETED)
      setOpen(false)
      await onDeleted()
    } catch (err) {
      const code = errorCodeFrom(err)
      reportError('account deletion failed', err, {
        feature: 'settings',
        action: 'delete_account',
        error_code: code,
      })
      feedback.error('feedback.deleteAccountFailed')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <section className='flex flex-col gap-2'>
      <h2 className='text-sm font-semibold text-slate-400 uppercase tracking-wide'>
        {t('settings.deleteAccountTitle')}
      </h2>
      <p className='text-slate-500 text-xs leading-relaxed'>{t('settings.deleteAccountHint')}</p>
      <button
        type='button'
        onClick={() => {
          setConfirmText('')
          setOpen(true)
        }}
        className='px-4 py-3 rounded-lg bg-red-950/50 hover:bg-red-950/70 text-red-300 text-left border border-red-900 transition-colors'
      >
        {t('settings.deleteAccount')}
      </button>

      <ConfirmModal
        isOpen={open}
        title={t('settings.deleteAccountConfirmTitle')}
        description={t('settings.deleteAccountConfirmDesc').replace('{{email}}', email ?? '—')}
        confirmLabel={deleting ? t('settings.deletingAccount') : t('settings.deleteAccountConfirmYes')}
        cancelLabel={t('settings.deleteAccountConfirmNo')}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setOpen(false)}
        confirmDisabled={!canConfirm}
      >
        <label className='mt-4 flex flex-col gap-2 text-left'>
          <span className='text-slate-400 text-xs'>
            {t('settings.deleteAccountTypePhrase').replace('{{phrase}}', requiredPhrase)}
          </span>
          <input
            type='text'
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            disabled={deleting}
            autoComplete='off'
            className='px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm focus:outline-none focus:border-red-500'
          />
        </label>
        {!canConfirm && confirmText.length > 0 && (
          <p className='text-amber-400 text-xs mt-2'>{t('settings.deleteAccountPhraseMismatch')}</p>
        )}
      </ConfirmModal>
    </section>
  )
}
