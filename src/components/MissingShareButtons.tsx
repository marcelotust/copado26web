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

async function buildShareImage(
  groups: MissingGroup[],
  teamName: (code: string) => string,
  teamFlag: (code: string) => string,
  total: number,
): Promise<Blob> {
  const W = 1080, H = 1920
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#020617')
  bg.addColorStop(1, '#0f172a')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  const header = ctx.createLinearGradient(0, 0, W, 280)
  header.addColorStop(0, '#1e3a5f')
  header.addColorStop(1, '#0d2818')
  ctx.fillStyle = header
  ctx.fillRect(0, 0, W, 280)

  ctx.textAlign = 'center'
  ctx.font = 'bold 72px system-ui, sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.fillText('⚽ Meu Álbum 2026', W / 2, 120)

  ctx.font = '48px system-ui, sans-serif'
  ctx.fillStyle = '#93c5fd'
  ctx.fillText(`me faltam ${total} figurinhas`, W / 2, 200)

  ctx.textAlign = 'left'
  let y = 340
  for (const { teamCode, numbers } of groups) {
    if (y > H - 220) break
    ctx.font = 'bold 50px system-ui, sans-serif'
    ctx.fillStyle = '#f1f5f9'
    ctx.fillText(`${teamFlag(teamCode)} ${teamName(teamCode)} (${numbers.length})`, 80, y)
    ctx.font = '36px monospace'
    ctx.fillStyle = '#64748b'
    const preview = numbers.slice(0, 9).map(n => `${teamCode} ${pad(n)}`).join(' · ')
    const overflow = numbers.length > 9 ? ` +${numbers.length - 9}` : ''
    ctx.fillText(preview + overflow, 80, y + 44)
    y += 108
  }

  ctx.textAlign = 'center'
  ctx.font = '36px system-ui, sans-serif'
  ctx.fillStyle = '#334155'
  ctx.fillText('Meu Álbum 2026 • Copa do Mundo 2026', W / 2, H - 60)

  return new Promise(resolve => canvas.toBlob(b => resolve(b!), 'image/png'))
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
        onClick={handleWhatsApp}
        className='flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-700 hover:bg-green-600 text-white text-sm font-semibold transition-colors'
      >
        <span>WhatsApp</span>
      </button>
      <button
        onClick={handleImage}
        disabled={sharing}
        className='flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors'
      >
        {sharing ? '...' : '🖼️'}
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
