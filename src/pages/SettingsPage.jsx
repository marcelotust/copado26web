// src/pages/SettingsPage.jsx
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function SettingsPage({ userId, onSignOut }) {
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
      console.error('Reset failed:', error)
      return
    }
    setResetDone(true)
    setShowResetConfirm(false)
    setTimeout(() => setResetDone(false), 3000)
  }

  async function handleExportCSV() {
    setExporting(true)
    const { data } = await supabase
      .from('stickers')
      .select('id, team_code, number, label, quantity, is_special')
      .eq('user_id', userId)
      .order('team_code', { ascending: true })
      .order('number', { ascending: true })

    if (!data) { setExporting(false); return }

    const header = 'id,team_code,number,label,quantity,is_special'
    const rows = data.map(s =>
      `${s.id},${s.team_code},${s.number},"${s.label ?? ''}",${s.quantity},${s.is_special}`
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'wc2026-album.csv'
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  return (
    <div className="p-6 max-w-md mx-auto flex flex-col gap-6">
      <h1 className="text-xl font-bold text-white">Settings</h1>

      {/* Logout */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Account</h2>
        <button
          onClick={onSignOut}
          className="px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-left transition-colors"
        >
          Sign out
        </button>
      </section>

      {/* Export CSV */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Data</h2>
        <button
          onClick={handleExportCSV}
          disabled={exporting}
          className="px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-left transition-colors disabled:opacity-50"
        >
          {exporting ? 'Preparing CSV…' : 'Export album to CSV'}
        </button>
      </section>

      {/* Reset Album */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Danger zone</h2>

        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-3 rounded-lg bg-red-900/40 hover:bg-red-900/60 text-red-400 text-left border border-red-800 transition-colors"
          >
            Reset album
          </button>
        ) : (
          <div className="rounded-lg border border-red-700 bg-red-950/50 p-4 flex flex-col gap-3">
            <p className="text-red-300 font-semibold">Are you absolutely sure?</p>
            <p className="text-slate-400 text-sm">
              This will set all sticker quantities to zero. Your account and login will remain.
              This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                disabled={resetting}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold disabled:opacity-50 transition-colors"
              >
                {resetting ? 'Resetting…' : 'Yes, reset everything'}
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {resetDone && (
          <p className="text-green-400 text-sm">Album has been reset.</p>
        )}
      </section>
    </div>
  )
}
