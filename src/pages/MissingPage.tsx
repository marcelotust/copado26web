import { useState } from 'react'
import { useI18n } from '../i18n'
import { useMissing, useSwaps, useTeams } from '../state/stickersStore'
import MissingShareButtons, { pad } from '../components/MissingShareButtons'
import { parseTradeList } from '../utils'

function TradeChecker({
  missingIds,
  swapIds,
  teamName,
  teamFlag,
}: {
  missingIds: Set<string>
  swapIds: Set<string>
  teamName: (code: string) => string
  teamFlag: (code: string) => string
}) {
  const [text, setText] = useState('')
  const [result, setResult] = useState<{ theyHave: string[]; youHave: string[] } | null>(null)

  function analyze() {
    const parsed = new Set(parseTradeList(text))
    const theyHave = [...parsed].filter(id => missingIds.has(id))
    const youHave  = [...swapIds].filter(id => parsed.has(id))
    setResult({ theyHave, youHave })
  }

  function labelFor(id: string) {
    const [team, num] = id.split('-')
    return `${teamFlag(team)} ${team} ${num}`
  }

  return (
    <div className='border border-slate-700 rounded-xl p-4 flex flex-col gap-3'>
      <p className='text-white font-bold text-sm'>Verificar troca</p>
      <p className='text-slate-500 text-xs'>Cole a lista de sobras do seu amigo (ex: "BRA 03 · ESP 12")</p>
      <textarea
        value={text}
        onChange={e => { setText(e.target.value); setResult(null) }}
        placeholder='BRA 03 · ESP 12 · FRA 07...'
        rows={3}
        className='w-full bg-slate-800 text-slate-200 text-sm font-mono rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-blue-500 resize-none'
      />
      <button
        onClick={analyze}
        disabled={!text.trim()}
        className='self-start px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-semibold transition-colors'
      >
        Analisar
      </button>

      {result && (
        <div className='flex flex-col gap-3 pt-1'>
          <div>
            <p className='text-green-400 text-xs font-bold mb-1'>
              Ele tem o que você precisa ({result.theyHave.length})
            </p>
            {result.theyHave.length === 0
              ? <p className='text-slate-600 text-xs'>Nenhuma coincidência</p>
              : <p className='text-slate-300 text-xs font-mono leading-relaxed'>{result.theyHave.map(labelFor).join(' · ')}</p>
            }
          </div>
          <div>
            <p className='text-amber-400 text-xs font-bold mb-1'>
              Você tem o que ele precisa ({result.youHave.length})
            </p>
            {result.youHave.length === 0
              ? <p className='text-slate-600 text-xs'>Nenhuma coincidência</p>
              : <p className='text-slate-300 text-xs font-mono leading-relaxed'>{result.youHave.map(labelFor).join(' · ')}</p>
            }
          </div>
        </div>
      )}
    </div>
  )
}

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
        <TradeChecker missingIds={missingIds} swapIds={swapIds} teamName={teamName} teamFlag={teamFlag} />

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
