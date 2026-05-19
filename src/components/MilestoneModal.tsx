import { useCallback, useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import { buildMilestoneShareText, interpolate } from '../lib/shareText'
import { drawMilestoneCard, milestoneCardToBlob } from '../lib/milestoneCardCanvas'
import type { MilestoneDrawInput } from '../lib/milestoneCardTypes'
import { shareOrDownloadPng } from '../lib/milestoneSharePng'
import type { Milestone } from '../hooks/useMilestoneDetector'
import { AnalyticsEvent, telemetry } from '../lib/telemetry'

type Props = { milestone: Milestone | null; onDismiss: () => void }

function cardInput(milestone: Milestone, t: (key: string) => string): MilestoneDrawInput {
  const copy = { tagline: t('milestone.tagline'), t }
  if (milestone.kind === 'team') {
    return {
      variant: 'team-complete',
      teamCode: milestone.teamCode,
      flag: milestone.flag,
      name: milestone.name,
      headline: t('milestone.teamHeadline'),
      copy,
    }
  }
  return {
    variant: 'pct',
    pct: milestone.pct,
    headline: interpolate(t('milestone.albumHeadline'), { pct: milestone.pct }),
    subline: interpolate(t('milestone.albumSubline'), { pct: milestone.pct }),
    copy,
  }
}

export default function MilestoneModal({ milestone, onDismiss }: Props) {
  const { t } = useI18n()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !milestone) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawMilestoneCard(ctx, cardInput(milestone, t))
  }, [milestone, t])

  const handleShare = useCallback(async () => {
    if (!milestone) return
    setSharing(true)
    try {
      const blob = await milestoneCardToBlob(cardInput(milestone, t))
      const shareText = buildMilestoneShareText(milestone, t)
      await shareOrDownloadPng(blob, t('share.appName'), shareText)
      telemetry.track(AnalyticsEvent.MILESTONE_SHARED, {
        kind: milestone.kind,
        ...(milestone.kind === 'album' ? { pct: milestone.pct } : { team_code: milestone.teamCode }),
      })
    } finally {
      setSharing(false)
    }
  }, [milestone, t])

  if (!milestone) return null
  const title =
    milestone.kind === 'album'
      ? interpolate(t('milestone.modalTitleAlbum'), { pct: milestone.pct })
      : t('milestone.modalTitleTeam')

  return (
    <div className='fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4' role='presentation'>
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby='milestone-modal-title'
        className='relative flex max-h-[92vh] w-full max-w-md flex-col gap-4 rounded-2xl border border-slate-700/80 bg-slate-900 p-4 shadow-2xl'
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id='milestone-modal-title' className='text-center text-lg font-bold text-white sm:text-xl'>
          {title}
        </h2>
        <div className='flex justify-center overflow-hidden rounded-xl bg-slate-950/80 p-2'>
          <canvas
            ref={canvasRef}
            width={1080}
            height={1920}
            className='h-auto max-h-[min(52vh,520px)] w-full max-w-[min(100%,min(52vh,520px)*9/16)] object-contain'
            aria-hidden
          />
        </div>
        <div className='flex flex-col gap-2 sm:flex-row sm:justify-end'>
          <button
            type='button'
            onClick={onDismiss}
            className='order-2 rounded-xl border border-slate-600 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 sm:order-1'
          >
            {t('milestone.close')}
          </button>
          <button
            type='button'
            disabled={sharing}
            onClick={handleShare}
            className='order-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60 sm:order-2'
          >
            {sharing ? t('milestone.sharing') : t('milestone.share')}
          </button>
        </div>
      </div>
    </div>
  )
}
