import { useState } from 'react'
import { useI18n } from '../i18n'
import type { MissingGroup } from '../state/stickersStore'

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function buildShareText(groups: MissingGroup[], teamName: (code: string) => string): string {
  const lines = groups.flatMap(({ teamCode, numbers }) => [
    teamName(teamCode),
    numbers.map(n => `${teamCode} ${pad(n)}`).join(' · '),
    '',
  ])
  return `🎴 Copa 2026 — Figurinhas faltando\n\n${lines.join('\n').trim()}`
}

type Props = { groups: MissingGroup[]; teamName: (code: string) => string }

export default function MissingShareButtons({ groups, teamName }: Props) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const text = buildShareText(groups, teamName)
    if (navigator.share) {
      try { await navigator.share({ text }); return } catch { /* fall through */ }
    }
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    }
  }

  function handleWhatsApp() {
    const text = buildShareText(groups, teamName)
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
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
  )
}

export { pad }
