import { useState } from 'react'
import { parseTradeList } from '../utils'

type Props = {
  missingIds: Set<string>
  swapIds: Set<string>
  teamName: (code: string) => string
  teamFlag: (code: string) => string
}

export default function MissingTradeChecker({ missingIds, swapIds, teamName, teamFlag }: Props) {
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
    return `${teamFlag(team)} ${teamName(team)} ${num}`
  }

  return (
    <div className='border border-slate-700 rounded-xl p-4 flex flex-col gap-3'>
      <p className='text-white font-bold text-sm'>Verificar troca</p>
      <p className='text-slate-500 text-xs'>
        {`Cole a lista de sobras do seu amigo (ex: "BRA 03 · ESP 12")`}
      </p>
      <textarea
        value={text}
        onChange={e => { setText(e.target.value); setResult(null) }}
        placeholder='BRA 03 · ESP 12 · FRA 07...'
        rows={3}
        className='w-full bg-slate-800 text-slate-200 text-sm font-mono rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-blue-500 resize-none'
      />
      <button
        type='button'
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
