import { useI18n } from '../i18n'
import { interpolate } from '../lib/shareText'
import type { ChallengeResult } from '../hooks/useChallengeProgress'
import type { ChallengeDifficulty } from '../data/challenges'

export const DIFFICULTY_COLOR: Record<ChallengeDifficulty, string> = {
  easy:   'bg-emerald-500',
  medium: 'bg-amber-500',
  hard:   'bg-rose-500',
}

export const DIFFICULTY_TRACK: Record<ChallengeDifficulty, string> = {
  easy:   'bg-emerald-900/40',
  medium: 'bg-amber-900/40',
  hard:   'bg-rose-900/40',
}

export const DIFFICULTY_BORDER: Record<ChallengeDifficulty, string> = {
  easy:   'border-emerald-800/40',
  medium: 'border-amber-800/40',
  hard:   'border-rose-800/40',
}

export default function ChallengeCard({ result }: { result: ChallengeResult }) {
  const { t } = useI18n()
  const { challenge, owned, total, pct, completed } = result
  const diff = challenge.difficulty

  return (
    <div
      className={[
        'flex gap-3 rounded-xl border p-3 transition-opacity',
        DIFFICULTY_BORDER[diff],
        completed ? 'opacity-60' : 'bg-slate-900',
      ].join(' ')}
    >
      <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-2xl'>
        {challenge.icon}
      </div>

      <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
        <div className='flex items-start justify-between gap-2'>
          <p className='text-sm font-semibold leading-tight text-white'>
            {challenge.title}
          </p>
          {completed && (
            <span className='shrink-0 rounded-full bg-emerald-700/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-300'>
              {t('challenges.completed')}
            </span>
          )}
        </div>

        <p className='text-xs leading-snug text-slate-400'>{challenge.description}</p>

        <div className='flex items-center gap-2'>
          <div className={['h-1.5 flex-1 overflow-hidden rounded-full', DIFFICULTY_TRACK[diff]].join(' ')}>
            <div
              className={['h-full rounded-full transition-all duration-500', DIFFICULTY_COLOR[diff]].join(' ')}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className='shrink-0 text-[11px] tabular-nums text-slate-500'>
            {interpolate(t('challenges.progress'), { owned, total })}
          </span>
        </div>
      </div>
    </div>
  )
}
