import { useState } from 'react'
import { useI18n } from '../i18n'
import { interpolate } from '../lib/shareText'
import { analyzeTradeListPaste } from '../lib/tradeListParse'

type Props = {
  missingIds: Set<string>
  swapIds: Set<string>
  validTeamCodes: ReadonlySet<string>
  teamName: (code: string) => string
  teamFlag: (code: string) => string
}

export default function MissingTradeChecker({
  missingIds,
  swapIds,
  validTeamCodes,
  teamName,
  teamFlag,
}: Props) {
  const { t } = useI18n()
  const [text, setText] = useState('')
  const [result, setResult] = useState<{ theyHave: string[]; youHave: string[] } | null>(null)
  const [formatError, setFormatError] = useState<string | null>(null)
  const [formatWarning, setFormatWarning] = useState<string | null>(null)
  const [shareHint, setShareHint] = useState(false)

  function analyze() {
    const analysis = analyzeTradeListPaste(text, validTeamCodes)
    if (analysis.noCodesFound) {
      setFormatError(t('missing.tradeChecker.invalidFormat'))
      setFormatWarning(null)
      setShareHint(false)
      setResult(null)
      return
    }

    setFormatError(null)
    setShareHint(analysis.fromAppShare)
    setFormatWarning(
      analysis.unknownTeamCodes.length > 0
        ? interpolate(t('missing.tradeChecker.unknownTeams'), {
          teams: analysis.unknownTeamCodes.join(', '),
        })
        : null,
    )

    const parsed = new Set(analysis.ids)
    const theyHave = [...parsed].filter(id => missingIds.has(id))
    const youHave = [...swapIds].filter(id => parsed.has(id))
    setResult({ theyHave, youHave })
  }

  function labelFor(id: string) {
    const [team, num] = id.split('-')
    return `${teamFlag(team)} ${teamName(team)} ${num}`
  }

  return (
    <div className='flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-900/45 p-4'>
      <p className='text-white font-bold text-sm'>Verificar troca</p>
      <p className='text-slate-500 text-xs'>{t('missing.tradeChecker.hint')}</p>
      <textarea
        value={text}
        onChange={e => {
          setText(e.target.value)
          setResult(null)
          setFormatError(null)
          setFormatWarning(null)
          setShareHint(false)
        }}
        placeholder={t('missing.tradeChecker.placeholder')}
        rows={3}
        className='w-full resize-none rounded-lg border border-slate-700 bg-slate-950/45 px-3 py-2 font-mono text-sm text-slate-200 focus:border-emerald-500 focus:outline-none'
      />
      <button
        type='button'
        onClick={analyze}
        disabled={!text.trim()}
        className='self-start rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-40'
      >
        {t('missing.tradeChecker.analyze')}
      </button>

      {formatError && (
        <p className='text-rose-400 text-xs leading-relaxed' role='alert'>{formatError}</p>
      )}
      {shareHint && !formatError && (
        <p className='text-sky-400/90 text-xs leading-relaxed'>{t('missing.tradeChecker.shareDetected')}</p>
      )}
      {formatWarning && (
        <p className='text-amber-400/90 text-xs leading-relaxed'>{formatWarning}</p>
      )}

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
