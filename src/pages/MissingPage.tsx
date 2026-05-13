import { useI18n } from '../i18n'
import { useMissing, useSwaps, useTeams } from '../state/stickersStore'
import MissingShareButtons from '../components/MissingShareButtons'
import MissingTradeChecker from '../components/MissingTradeChecker'
import { pad } from '../lib/missingShareBuilders'

export default function MissingPage() {
  const { t } = useI18n()
  const groups = useMissing()
  const teams  = useTeams()
  const { swapsByTeam } = useSwaps()

  const totalMissing = groups.reduce((acc, g) => acc + g.numbers.length, 0)

  const missingIds = new Set(
    groups.flatMap(({ teamCode, numbers }) => numbers.map(n => `${teamCode}-${pad(n)}`))
  )
  const swapIds = new Set(
    swapsByTeam.flatMap(({ stickers }) => stickers.map(s => s.id))
  )

  function teamName(code: string): string {
    const team = teams.find(team => team.code === code)
    return team ? t(team.name_key) : code
  }

  function teamFlag(code: string): string {
    return teams.find(team => team.code === code)?.flag ?? ''
  }

  if (groups.length === 0) {
    return (
      <div className='flex-1 flex flex-col items-center justify-center gap-2 px-6 text-center'>
        <span className='text-5xl'>🏆</span>
        <p className='text-white font-bold text-lg'>{t('missing.emptyTitle')}</p>
        <p className='text-slate-400 text-sm'>{t('missing.emptyDesc')}</p>
      </div>
    )
  }

  return (
    <div className='flex flex-col h-full'>
      <div className='shrink-0 flex items-center justify-between gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800'>
        <p className='text-slate-400 text-sm'>
          <span className='text-white font-bold'>{totalMissing}</span>{' '}
          {totalMissing === 1 ? t('missing.sticker') : t('missing.stickers')}{' '}
          {t('missing.missing')}
        </p>
        <MissingShareButtons groups={groups} total={totalMissing} teamName={teamName} teamFlag={teamFlag} />
      </div>

      <div className='flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5'>
        <MissingTradeChecker missingIds={missingIds} swapIds={swapIds} teamName={teamName} teamFlag={teamFlag} />

        {groups.map(({ teamCode, numbers }) => (
          <div key={teamCode}>
            <p className='text-white font-bold text-sm mb-1'>{teamFlag(teamCode)} {teamName(teamCode)}</p>
            <p className='text-slate-400 text-sm font-mono leading-relaxed'>
              {numbers.map(n => `${teamCode} ${pad(n)}`).join(' · ')}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
