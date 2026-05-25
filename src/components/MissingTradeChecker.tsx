import { useState } from 'react'
import { useI18n } from '../i18n'
import { interpolate } from '../lib/shareText'
import { analyzeTradeListPaste, type TradeListKind } from '../lib/tradeListParse'
import { useApplyTrade, useCatalogOrder } from '../state/stickersStore'
import { decodeAlbumBitmap } from '../lib/albumBitmap'
import { AnalyticsEvent, telemetry } from '../lib/telemetry'
import TradeChips from './TradeChips'
import AlbumQRModal from './AlbumQRModal'
import AlbumQRScanner from './AlbumQRScanner'

type Props = {
  missingIds: Set<string>
  swapIds: Set<string>
  validTeamCodes: ReadonlySet<string>
  teamFlag: (code: string) => string
}

type Result = {
  theyHave: string[]
  youHave: string[]
  kind: TradeListKind
  source: 'paste' | 'qr'
}

export default function MissingTradeChecker({
  missingIds, swapIds, validTeamCodes, teamFlag,
}: Props) {
  const { t } = useI18n()
  const applyTrade = useApplyTrade()
  const order = useCatalogOrder()
  const [text, setText] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [formatError, setFormatError] = useState<string | null>(null)
  const [formatWarning, setFormatWarning] = useState<string | null>(null)
  const [selReceived, setSelReceived] = useState<Set<string>>(new Set())
  const [selGiven, setSelGiven] = useState<Set<string>>(new Set())
  const [applying, setApplying] = useState(false)
  const [done, setDone] = useState<{ received: number; given: number } | null>(null)
  const [showMyQr, setShowMyQr] = useState(false)
  const [scanning, setScanning] = useState(false)

  function resetOutput() {
    setResult(null)
    setFormatError(null)
    setFormatWarning(null)
    setSelReceived(new Set())
    setSelGiven(new Set())
    setDone(null)
  }

  function analyze() {
    const analysis = analyzeTradeListPaste(text, validTeamCodes)
    if (analysis.noCodesFound) {
      resetOutput()
      setFormatError(t('missing.tradeChecker.invalidFormat'))
      return
    }
    setFormatError(null)
    setDone(null)
    setSelReceived(new Set())
    setSelGiven(new Set())
    setFormatWarning(
      analysis.unknownTeamCodes.length > 0
        ? interpolate(t('missing.tradeChecker.unknownTeams'), { teams: analysis.unknownTeamCodes.join(', ') })
        : null,
    )
    const parsed = new Set(analysis.ids)
    setResult({
      theyHave: [...parsed].filter(id => missingIds.has(id)),
      youHave: [...swapIds].filter(id => parsed.has(id)),
      kind: analysis.kind,
      source: 'paste',
    })
  }

  function handleQrDecode(raw: string) {
    const decoded = decodeAlbumBitmap(raw, order)
    if (decoded.status === 'invalid') {
      setFormatWarning(t('missing.tradeChecker.qrInvalid'))
      return // keep the scanner open so the user can try the right QR
    }
    setScanning(false)
    if (decoded.status === 'version_mismatch') {
      setFormatError(t('missing.tradeChecker.qrVersionMismatch'))
      return
    }
    setFormatError(null)
    setFormatWarning(null)
    setDone(null)
    setSelReceived(new Set())
    setSelGiven(new Set())
    telemetry.track(AnalyticsEvent.QR_ALBUM_SCANNED)
    setResult({
      theyHave: decoded.swaps.filter(id => missingIds.has(id)),
      youHave: decoded.missing.filter(id => swapIds.has(id)),
      kind: 'unknown',
      source: 'qr',
    })
  }

  function toggle(set: Set<string>, setSet: (s: Set<string>) => void, id: string) {
    const next = new Set(set)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSet(next)
  }

  const total = (result?.theyHave.length ?? 0) + (result?.youHave.length ?? 0)
  const selCount = selReceived.size + selGiven.size
  const allSelected = total > 0 && selCount === total

  function toggleAll() {
    if (!result) return
    if (allSelected) {
      setSelReceived(new Set())
      setSelGiven(new Set())
    } else {
      setSelReceived(new Set(result.theyHave))
      setSelGiven(new Set(result.youHave))
    }
  }

  async function register() {
    if (!result || selCount === 0 || applying) return
    const received = [...selReceived]
    const given = [...selGiven]
    setApplying(true)
    setFormatError(null)
    try {
      await applyTrade(received, given)
      telemetry.track(AnalyticsEvent.TRADE_RECORDED, {
        received_count: received.length,
        given_count: given.length,
        source: result.source,
        list_kind: result.kind,
      })
      setDone({ received: received.length, given: given.length })
      setResult(null)
      setSelReceived(new Set())
      setSelGiven(new Set())
    } catch {
      setFormatError(t('missing.tradeChecker.registerFailed'))
    } finally {
      setApplying(false)
    }
  }

  const shareHint = result?.source !== 'paste'
    ? null
    : result.kind === 'swaps'
      ? t('missing.tradeChecker.detectedSwaps')
      : result.kind === 'missing'
        ? t('missing.tradeChecker.detectedMissing')
        : null

  return (
    <div
      className='flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-900/45 p-4'
      data-onboarding-target='missing-trade-checker'
    >
      <p className='text-white font-bold text-sm'>{t('missing.tradeChecker.title')}</p>
      <p className='text-slate-500 text-xs'>{t('missing.tradeChecker.hint')}</p>
      <textarea
        value={text}
        onChange={e => { setText(e.target.value); resetOutput() }}
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

      <div className='flex flex-wrap items-center gap-2'>
        <button
          type='button'
          onClick={() => { setScanning(true); setFormatError(null); setFormatWarning(null) }}
          className='rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:border-slate-400'
        >
          {t('missing.tradeChecker.qrScan')}
        </button>
        <button
          type='button'
          onClick={() => setShowMyQr(true)}
          className='rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:border-slate-400'
        >
          {t('missing.tradeChecker.qrMine')}
        </button>
      </div>
      {scanning && <AlbumQRScanner onDecode={handleQrDecode} onClose={() => setScanning(false)} />}

      {formatError && <p className='text-rose-400 text-xs leading-relaxed' role='alert'>{formatError}</p>}
      {shareHint && !formatError && <p className='text-sky-400/90 text-xs leading-relaxed'>{shareHint}</p>}
      {formatWarning && <p className='text-amber-400/90 text-xs leading-relaxed'>{formatWarning}</p>}
      {done && (
        <p className='text-emerald-400 text-xs font-semibold' role='status'>
          {interpolate(t('missing.tradeChecker.registered'), { received: done.received, given: done.given })}
        </p>
      )}

      {result && (
        <div className='flex flex-col gap-3 pt-1'>
          <p className='text-slate-500 text-xs'>{t('missing.tradeChecker.selectHint')}</p>

          <div className='flex flex-col gap-1.5'>
            <p className='text-green-400 text-xs font-bold'>
              {interpolate(t('missing.tradeChecker.theyHave'), { count: result.theyHave.length })}
            </p>
            {result.theyHave.length === 0
              ? <p className='text-slate-600 text-xs'>{t('missing.tradeChecker.noMatch')}</p>
              : <TradeChips ids={result.theyHave} selected={selReceived} teamFlag={teamFlag} tone='green'
                  onToggle={id => toggle(selReceived, setSelReceived, id)} />}
          </div>

          <div className='flex flex-col gap-1.5'>
            <p className='text-amber-400 text-xs font-bold'>
              {interpolate(t('missing.tradeChecker.youHave'), { count: result.youHave.length })}
            </p>
            {result.youHave.length === 0
              ? <p className='text-slate-600 text-xs'>{t('missing.tradeChecker.noMatch')}</p>
              : <>
                  <TradeChips ids={result.youHave} selected={selGiven} teamFlag={teamFlag} tone='amber'
                    onToggle={id => toggle(selGiven, setSelGiven, id)} />
                  {result.source === 'paste' && result.kind !== 'missing' && (
                    <p className='text-amber-400/80 text-[11px] leading-relaxed'>{t('missing.tradeChecker.giveCaution')}</p>
                  )}
                </>}
          </div>

          {total > 0 && (
            <div className='flex flex-wrap items-center gap-2 pt-1'>
              <button
                type='button'
                onClick={toggleAll}
                className='rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:border-slate-400'
              >
                {allSelected ? t('missing.tradeChecker.clearSelection') : t('missing.tradeChecker.tradeAll')}
              </button>
              <button
                type='button'
                onClick={register}
                disabled={selCount === 0 || applying}
                className='rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-40'
              >
                {applying
                  ? t('missing.tradeChecker.registering')
                  : `${t('missing.tradeChecker.register')} (+${selReceived.size} / −${selGiven.size})`}
              </button>
            </div>
          )}
        </div>
      )}

      <AlbumQRModal open={showMyQr} onClose={() => setShowMyQr(false)} />
    </div>
  )
}
