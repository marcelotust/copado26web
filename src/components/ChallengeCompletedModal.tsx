import { useState } from 'react'
import { useI18n } from '../i18n'
import { isShareAbort, logger } from '../lib/logger'
import { challengeDescription, challengeTitle } from '../lib/challengeI18n'
import { interpolate } from '../lib/shareText'
import type { Challenge } from '../data/challenges'

type Props = {
  challenge: Challenge | null
  onDismiss: () => void
}

export default function ChallengeCompletedModal({ challenge, onDismiss }: Props) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  if (!challenge) return null

  async function handleShare() {
    const text = interpolate(t('challenges.shareText'), {
      title: challengeTitle(challenge!, t),
    })
    if (navigator.share) {
      try { await navigator.share({ text }); return } catch (err) {
        if (isShareAbort(err)) return
        logger.warn('challenge share API failed', { feature: 'challenges', action: 'native_share' })
      }
    }
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      logger.warn('challenge clipboard failed', { feature: 'challenges', action: 'clipboard' })
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div
      className='fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4'
      role='presentation'
      onClick={onDismiss}
    >
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby='challenge-modal-title'
        className='relative flex w-full max-w-sm flex-col items-center gap-5 rounded-2xl border border-slate-700/80 bg-slate-900 p-6 shadow-2xl'
        onClick={e => e.stopPropagation()}
      >
        <span className='text-7xl leading-none' aria-hidden>{challenge.icon}</span>

        <div className='text-center'>
          <h2
            id='challenge-modal-title'
            className='text-lg font-bold text-white sm:text-xl'
          >
            {t('challenges.modalTitle')}
          </h2>
          <p className='mt-1 text-base font-semibold text-emerald-400'>
            {challengeTitle(challenge, t)}
          </p>
          <p className='mt-1 text-sm text-slate-400'>{challengeDescription(challenge, t)}</p>
        </div>

        <div className='flex w-full flex-col gap-2 sm:flex-row sm:justify-end'>
          <button
            type='button'
            onClick={onDismiss}
            className='order-2 rounded-xl border border-slate-600 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 sm:order-1'
          >
            {t('challenges.modalClose')}
          </button>
          <button
            type='button'
            onClick={handleShare}
            className='order-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 sm:order-2'
          >
            {copied ? t('challenges.copied') : t('challenges.modalShare')}
          </button>
        </div>
      </div>
    </div>
  )
}
