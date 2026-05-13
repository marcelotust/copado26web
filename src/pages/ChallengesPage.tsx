import { useI18n } from '../i18n'
import { interpolate } from '../lib/shareText'
import { useChallengeProgress, type ChallengeResult } from '../hooks/useChallengeProgress'
import { CHALLENGES, type ChallengeDifficulty } from '../data/challenges'

const DIFFICULTY_ORDER: ChallengeDifficulty[] = ['easy', 'medium', 'hard']

const DIFFICULTY_COLOR: Record<ChallengeDifficulty, string> = {
  easy:   'bg-emerald-500',
  medium: 'bg-amber-500',
  hard:   'bg-rose-500',
}

const DIFFICULTY_TRACK: Record<ChallengeDifficulty, string> = {
  easy:   'bg-emerald-900/40',
  medium: 'bg-amber-900/40',
  hard:   'bg-rose-900/40',
}

const DIFFICULTY_BORDER: Record<ChallengeDifficulty, string> = {
  easy:   'border-emerald-800/40',
  medium: 'border-amber-800/40',
  hard:   'border-rose-800/40',
}

function ChallengeCard({ result }: { result: ChallengeResult }) {
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

function Section({
  difficulty,
  results,
}: {
  difficulty: ChallengeDifficulty
  results: ChallengeResult[]
}) {
  const { t } = useI18n()
  if (results.length === 0) return null

  const label = t(`challenges.${difficulty}`)
  const done = results.filter(r => r.completed)
  const pending = results.filter(r => !r.completed)

  return (
    <section className='flex flex-col gap-2'>
      <h2 className='px-1 text-xs font-bold uppercase tracking-widest text-slate-500'>
        {label}
      </h2>
      {pending.map(r => <ChallengeCard key={r.challenge.id} result={r} />)}
      {done.map(r => <ChallengeCard key={r.challenge.id} result={r} />)}
    </section>
  )
}

export default function ChallengesPage() {
  const results = useChallengeProgress()

  const byDifficulty = (diff: ChallengeDifficulty) =>
    CHALLENGES
      .filter(c => c.difficulty === diff)
      .map(c => results.find(r => r.challenge.id === c.id)!)
      .filter(Boolean)

  return (
    <div className='flex flex-col h-full'>
      <div className='flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-6'>
        {DIFFICULTY_ORDER.map(diff => (
          <Section
            key={diff}
            difficulty={diff}
            results={byDifficulty(diff)}
          />
        ))}
      </div>
    </div>
  )
}
