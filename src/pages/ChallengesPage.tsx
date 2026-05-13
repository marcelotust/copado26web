import { useI18n } from '../i18n'
import { useChallengeProgress } from '../hooks/useChallengeProgress'
import { CHALLENGES, type ChallengeDifficulty } from '../data/challenges'
import ChallengeCard from '../components/ChallengeCard'

const DIFFICULTY_ORDER: ChallengeDifficulty[] = ['easy', 'medium', 'hard']

export default function ChallengesPage() {
  const { t } = useI18n()
  const results = useChallengeProgress()

  const byDifficulty = (diff: ChallengeDifficulty) =>
    CHALLENGES
      .filter(c => c.difficulty === diff)
      .map(c => results.find(r => r.challenge.id === c.id)!)
      .filter(Boolean)

  return (
    <div className='flex flex-col h-full'>
      <div className='flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-6'>
        {DIFFICULTY_ORDER.map(diff => {
          const all = byDifficulty(diff)
          if (all.length === 0) return null
          const pending = all.filter(r => !r.completed)
          const done    = all.filter(r => r.completed)
          return (
            <section key={diff} className='flex flex-col gap-2'>
              <h2 className='px-1 text-xs font-bold uppercase tracking-widest text-slate-500'>
                {t(`challenges.${diff}`)}
              </h2>
              {pending.map(r => <ChallengeCard key={r.challenge.id} result={r} />)}
              {done.map(r    => <ChallengeCard key={r.challenge.id} result={r} />)}
            </section>
          )
        })}
      </div>
    </div>
  )
}
