// src/pages/SettingsPage.jsx
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useI18n } from '../i18n'
import { emitStickerChanged } from '../lib/stickerEvents'
import ConfirmModal from '../components/ConfirmModal'
import { useFeedback } from '../components/FeedbackProvider'

export default function SettingsPage({ userId, email, onSignOut }) {
  const { t } = useI18n()
  const { push } = useFeedback()
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetDone, setResetDone] = useState(false)
  const [exporting, setExporting] = useState(false)

  async function handleReset() {
    setResetting(true)
    const { error } = await supabase
      .from('stickers')
      .update({ quantity: 0 })
      .eq('user_id', userId)
    setResetting(false)
    if (error) {
      push(t('errors.resetFailed'), { variant: 'error' })
      return
    }
    emitStickerChanged()
    setResetDone(true)
    setShowResetConfirm(false)
    setTimeout(() => setResetDone(false), 3000)
  }

  async function handleExportCSV() {
    setExporting(true)
    const { data, error } = await supabase
      .from('stickers')
      .select('id, team_code, number, label, quantity, is_special')
      .eq('user_id', userId)
      .order('team_code', { ascending: true })
      .order('number', { ascending: true })

    if (error || !data) {
      setExporting(false)
      push(t('errors.exportFailed'), { variant: 'error' })
      return
    }

    const header = 'id,team_code,number,label,quantity,is_special'
    const rows = data.map(s =>
      `${s.id},${s.team_code},${s.number},"${s.label ?? ''}",${s.quantity},${s.is_special}`
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'meualbum2026.csv'
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  return (
    <div className="p-6 max-w-md mx-auto flex flex-col gap-6">
      <h1 className="text-xl font-bold text-white">{t('settings.title')}</h1>

      {/* Account */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">{t('settings.account')}</h2>
        {email && (
          <div className="px-4 py-3 rounded-lg bg-slate-800 border border-slate-700">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">{t('menu.loggedInAs')}</p>
            <p className="text-white text-sm truncate">{email}</p>
          </div>
        )}
        <button
          onClick={onSignOut}
          className="px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-left transition-colors"
        >
          {t('settings.signOut')}
        </button>
      </section>

      {/* Export CSV */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">{t('settings.data')}</h2>
        <button
          onClick={handleExportCSV}
          disabled={exporting}
          className="px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-left transition-colors disabled:opacity-50"
        >
          {exporting ? t('settings.exportingCSV') : t('settings.exportCSV')}
        </button>
      </section>

      {/* Reset Album */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">{t('settings.dangerZone')}</h2>

        <button
          onClick={() => setShowResetConfirm(true)}
          className="px-4 py-3 rounded-lg bg-red-900/40 hover:bg-red-900/60 text-red-400 text-left border border-red-800 transition-colors"
        >
          {t('settings.resetAlbum')}
        </button>

        {resetDone && (
          <p className="text-green-400 text-sm">{t('settings.resetDone')}</p>
        )}
      </section>

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
    </div>
  )
}
