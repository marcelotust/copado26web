import { useState } from 'react'
import { AnalyticsEvent, telemetry } from '../lib/telemetry'

type Props = {
  getShareText: () => string
  shareLabel: string
  copiedLabel: string
}

export default function StickerShareActions({ getShareText, shareLabel, copiedLabel }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const text = getShareText()
    if (navigator.share) {
      try { await navigator.share({ text }); return } catch { /* fall through */ }
    }
    try {
      await navigator.clipboard.writeText(text)
      telemetry.track(AnalyticsEvent.STICKERS_SHARED, { channel: 'clipboard' })
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      telemetry.track(AnalyticsEvent.STICKERS_SHARED, { channel: 'whatsapp' })
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    }
  }

  function handleWhatsApp() {
    const text = getShareText()
    telemetry.track(AnalyticsEvent.STICKERS_SHARED, { channel: 'whatsapp' })
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
        <span className='truncate'>{copied ? copiedLabel : shareLabel}</span>
      </button>
    </div>
  )
}
