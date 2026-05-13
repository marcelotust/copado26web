import { useState } from 'react'
import { useI18n } from '../i18n'
import type { MissingGroup } from '../state/stickersStore'
import { buildShareImage, buildShareText } from '../lib/missingShareBuilders'

type Props = {
  groups: MissingGroup[]
  total: number
  teamName: (code: string) => string
  teamFlag: (code: string) => string
}

export default function MissingShareButtons({ groups, total, teamName, teamFlag }: Props) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  const [sharing, setSharing] = useState(false)

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

  async function handleImage() {
    setSharing(true)
    try {
      const blob = await buildShareImage(groups, teamName, teamFlag, total)
      const file = new File([blob], 'meu-album-2026.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'meu-album-2026.png'
        a.click()
        URL.revokeObjectURL(url)
      }
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className='flex gap-2'>
      <button
        type='button'
        onClick={handleWhatsApp}
        className='flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-700 hover:bg-green-600 text-white text-sm font-semibold transition-colors'
      >
        <span>WhatsApp</span>
      </button>
      <button
        type='button'
        onClick={handleImage}
        disabled={sharing}
        className='flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors'
      >
        {sharing ? '...' : '🖼️'}
      </button>
      <button
        type='button'
        onClick={handleShare}
        className='flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition-colors'
      >
        {copied ? t('missing.copied') : t('missing.share')}
      </button>
    </div>
  )
}

export { pad } from '../lib/missingShareBuilders'
