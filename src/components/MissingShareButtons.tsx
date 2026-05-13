import { useState } from 'react'
import { useI18n } from '../i18n'
import type { MissingGroup } from '../state/stickersStore'

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function buildShareText(
  groups: MissingGroup[],
  teamName: (code: string) => string,
  teamFlag: (code: string) => string,
  total: number,
): string {
  const lines = groups.flatMap(({ teamCode, numbers }) => [
    `${teamFlag(teamCode)} ${teamName(teamCode)} (${numbers.length})`,
    numbers.map(n => `${teamCode} ${pad(n)}`).join(' · '),
    '',
  ])
  return `⚽ Copa 2026 — me faltam ${total} figurinhas!\n\n${lines.join('\n').trim()}`
}

type Props = {
  groups: MissingGroup[]
  total: number
  teamName: (code: string) => string
  teamFlag: (code: string) => string
}

export default function MissingShareButtons({ groups, total, teamName, teamFlag }: Props) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const text = buildShareText(groups, teamName, teamFlag, total)
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
    const text = buildShareText(groups, teamName, teamFlag, total)
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className='flex flex-wrap gap-1.5 justify-end w-full min-w-0 sm:w-auto sm:flex-nowrap sm:gap-2'>
      <button
        type='button'
        onClick={handleWhatsApp}
        className='flex flex-1 min-w-[6.5rem] max-w-[11rem] sm:flex-initial sm:max-w-none items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-green-700 hover:bg-green-600 text-white text-xs font-semibold transition-colors sm:px-3 sm:text-sm'
      >
        <span className='truncate'>WhatsApp</span>
      </button>
      <button
        type='button'
        onClick={handleShare}
        className='flex flex-1 min-w-[6.5rem] max-w-[11rem] sm:flex-initial sm:max-w-none items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold transition-colors sm:px-3 sm:text-sm'
      >
        <span className='truncate'>{copied ? t('missing.copied') : t('missing.share')}</span>
      </button>
    </div>
  )
}

export { pad }
