import { useState } from 'react'
import { useI18n } from '../i18n'
import { useMissing, useTeams } from '../state/stickersStore'

/** @param {number} n */
function pad(n) {
  return String(n).padStart(2, '0')
}

/** @param {{ teamCode: string, numbers: number[] }[]} groups @param {(code: string) => string} teamName */
function buildShareText(groups, teamName) {
  const lines = groups.flatMap(({ teamCode, numbers }) => [
    teamName(teamCode),
    numbers.map(n => `${teamCode} ${pad(n)}`).join(' · '),
    '',
  ])
  return `🎴 Copa 2026 — Figurinhas faltando\n\n${lines.join('\n').trim()}`
}

export default function MissingPage() {
  const { t } = useI18n()
  const groups = useMissing()
  const teams  = useTeams()
  const [copied, setCopied] = useState(false)

  const totalMissing = groups.reduce((acc, g) => acc + g.numbers.length, 0)

  function teamName(code) {
    const team = teams.find(team => team.code === code)
    return team ? t(team.name_key) : code
  }

  async function handleShare() {
    const text = buildShareText(groups, teamName)
    if (navigator.share) {
      try {
        await navigator.share({ text })
        return
      } catch {
        // user cancelled or share failed — fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`
      window.open(url, '_blank')
    }
  }

  function handleWhatsApp() {
    const text = buildShareText(groups, teamName)
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  if (groups.length === 0) {
    return (
      <div className='flex-1 flex flex-col items-center justify-center gap-2 px-6 text-center'>
        <span className='text-5xl'>🏆</span>
        <p className='text-white font-bold text-lg'>{t('missing.emptyTitle')}</p>
        <p className='text-slate-400 text-sm'>{t('missing.emptyDesc')}</p>
      </div>
    )
  }

  return (
    <div className='flex flex-col h-full'>
      <div className='shrink-0 flex items-center justify-between gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800'>
        <p className='text-slate-400 text-sm'>
          <span className='text-white font-bold'>{totalMissing}</span>{' '}
          {totalMissing === 1 ? t('missing.sticker') : t('missing.stickers')}{' '}
          {t('missing.missing')}
        </p>
        <div className='flex gap-2'>
          <button
            onClick={handleWhatsApp}
            className='flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-700 hover:bg-green-600 text-white text-sm font-semibold transition-colors'
          >
            <span>WhatsApp</span>
          </button>
          <button
            onClick={handleShare}
            className='flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition-colors'
          >
            {copied ? t('missing.copied') : t('missing.share')}
          </button>
        </div>
      </div>

      <div className='flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5'>
        {groups.map(({ teamCode, numbers }) => (
          <div key={teamCode}>
            <p className='text-white font-bold text-sm mb-1'>{teamName(teamCode)}</p>
            <p className='text-slate-400 text-sm font-mono leading-relaxed'>
              {numbers.map(n => `${teamCode} ${pad(n)}`).join(' · ')}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
