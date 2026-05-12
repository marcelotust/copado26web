// src/pages/SettingsPage.jsx
import { useState } from 'react'
import { useI18n } from '../i18n'
import { useResetAlbum, useCatalogSnapshot } from '../state/stickersStore'
import ConfirmModal from '../components/ConfirmModal'

export default function SettingsPage({ email, onSignOut }) {
  const { t } = useI18n()
  const resetAlbum = useResetAlbum()
  const { catalog, quantities } = useCatalogSnapshot()

  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetDone, setResetDone] = useState(false)
  const [exporting, setExporting] = useState(false)

  async function handleReset() {
    setResetting(true)
    try {
      await resetAlbum()
      setResetDone(true)
      setShowResetConfirm(false)
      setTimeout(() => setResetDone(false), 3000)
    } catch (err) {
      console.error('Reset failed:', err)
    } finally {
      setResetting(false)
    }
  }

  function handleExportCSV() {
    setExporting(true)
    try {
      const rows = []
      for (const sticker of catalog.values()) {
        const qty = quantities.get(sticker.id) ?? 0
        const label = sticker.player_name ?? ''
        rows.push(`${sticker.id},${sticker.team_code},${sticker.number},"${label}",${qty},${sticker.is_special}`)
      }
      rows.sort()
      const csv = ['id,team_code,number,label,quantity,is_special', ...rows].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'meualbum2026.csv'
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto flex flex-col gap-6">
      <h1 className="text-xl font-bold text-white">{t('settings.title')}</h1>

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
