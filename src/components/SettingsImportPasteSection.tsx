import { useState } from 'react'
import { useI18n } from '../i18n'
import { buildPasteLookup, parsePasteText, applyPasteAdditive } from '../lib/albumPaste'
import { diffQuantityMaps } from '../lib/albumCsv'
import { useCatalogSnapshot, useReplaceAllQuantities } from '../state/stickersStore'
import SimpleDialog from './SimpleDialog'
import ConfirmModal from './ConfirmModal'
import { useFeedback } from '../contexts/FeedbackContext'
import { reportError } from '../lib/logger'
import { AnalyticsEvent, telemetry } from '../lib/telemetry'

type ImportMode = 'additive' | 'replace'

export default function SettingsImportPasteSection() {
  const { t } = useI18n()
  const feedback = useFeedback()
  const { catalog, quantities } = useCatalogSnapshot()
  const replaceAll = useReplaceAllQuantities()

  const [text, setText] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [found, setFound] = useState<Map<string, number> | null>(null)
  const [unknownCodes, setUnknownCodes] = useState<string[]>([])
  const [mode, setMode] = useState<ImportMode>('additive')

  function buildMergedMap(f: Map<string, number>, m: ImportMode): Map<string, number> {
    return m === 'additive' ? applyPasteAdditive(quantities, f) : f
  }

  function onImport() {
    setParseError(null)
    const lookup = buildPasteLookup(catalog)
    const result = parsePasteText(text, lookup)
    if (result.found.size === 0) {
      setParseError(t('settings.importPasteErrorEmpty'))
      return
    }
    setFound(result.found)
    setUnknownCodes(result.unknownCodes)
    setPreviewOpen(true)
  }

  async function runImport() {
    if (!found) return
    const mergedMap = buildMergedMap(found, mode)
    const diff = diffQuantityMaps(quantities, mergedMap)
    setImporting(true)
    try {
      await replaceAll(mergedMap)
      telemetry.track(AnalyticsEvent.ALBUM_IMPORTED, {
        source: 'paste',
        import_mode: mode,
        found: found.size,
        unknown_count: unknownCodes.length,
        changed: diff.changedIds,
        added: diff.unitsAdded,
        removed: diff.unitsRemoved,
      })
      setConfirmOpen(false)
      setPreviewOpen(false)
      setFound(null)
      setUnknownCodes([])
      setText('')
    } catch (err) {
      reportError('paste import failed', err, { feature: 'settings', action: 'import_paste' })
      setParseError(t('settings.importPasteErrorNetwork'))
      feedback.error('feedback.importFailed')
    } finally {
      setImporting(false)
    }
  }

  const previewDiff = found ? diffQuantityMaps(quantities, buildMergedMap(found, mode)) : null

  return (
    <section className='flex flex-col gap-2'>
      <p className='text-xs text-slate-400'>{t('settings.importPasteLabel')}</p>
      <textarea
        value={text}
        onChange={e => { setText(e.target.value); setParseError(null) }}
        placeholder={t('settings.importPastePlaceholder')}
        rows={5}
        className='w-full rounded-lg bg-slate-700 text-white text-sm p-3 resize-none placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500'
      />
      <button
        type='button'
        onClick={onImport}
        disabled={!text.trim()}
        className='px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-left transition-colors disabled:opacity-50'
      >
        {t('settings.importPasteButton')}
      </button>
      {parseError && <p className='text-amber-400 text-sm'>{parseError}</p>}

      <SimpleDialog
        isOpen={previewOpen}
        title={t('settings.importPastePreviewTitle')}
        onClose={() => { if (importing) return; setPreviewOpen(false) }}
      >
        <p>{t('settings.importPasteFound').replace('{{n}}', String(found?.size ?? 0))}</p>
        {unknownCodes.length > 0 && (
          <p className='mt-1 text-amber-400 text-sm'>
            {t('settings.importPasteUnknownCodes').replace('{{codes}}', unknownCodes.join(', '))}
          </p>
        )}
        {previewDiff && (
          <ul className='list-disc pl-5 space-y-1 mt-3 text-sm'>
            <li>{t('settings.importDiffChanged').replace('{{n}}', String(previewDiff.changedIds))}</li>
            <li>{t('settings.importDiffAdded').replace('{{n}}', String(previewDiff.unitsAdded))}</li>
            <li>{t('settings.importDiffRemoved').replace('{{n}}', String(previewDiff.unitsRemoved))}</li>
          </ul>
        )}

        <div className='mt-4 flex flex-col gap-3'>
          {(['additive', 'replace'] as ImportMode[]).map(m => (
            <label key={m} className='flex items-start gap-3 cursor-pointer'>
              <input
                type='radio'
                name='import-mode'
                checked={mode === m}
                onChange={() => setMode(m)}
                className='mt-0.5 accent-emerald-500'
              />
              <span>
                <span className='text-white font-medium text-sm block'>
                  {t(m === 'additive' ? 'settings.importPasteModeAdditive' : 'settings.importPasteModeReplace')}
                </span>
                <span className='text-slate-400 text-xs block'>
                  {t(m === 'additive' ? 'settings.importPasteModeAdditiveDesc' : 'settings.importPasteModeReplaceDesc')}
                </span>
              </span>
            </label>
          ))}
        </div>

        <div className='mt-6 flex flex-col gap-2'>
          <button
            type='button'
            disabled={importing}
            onClick={() => setPreviewOpen(false)}
            className='py-2.5 rounded-xl font-semibold text-sm bg-slate-700 hover:bg-slate-600 text-white'
          >
            {t('settings.importCancel')}
          </button>
          <button
            type='button'
            disabled={importing}
            onClick={() => { setPreviewOpen(false); setConfirmOpen(true) }}
            className='py-2.5 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-500 text-white'
          >
            {t('settings.importContinue')}
          </button>
        </div>
      </SimpleDialog>

      <ConfirmModal
        isOpen={confirmOpen}
        title={t('settings.importPasteConfirmTitle')}
        description={t(mode === 'additive'
          ? 'settings.importPasteConfirmDescAdditive'
          : 'settings.importPasteConfirmDescReplace')}
        confirmLabel={importing ? t('settings.importPasteImporting') : t('settings.importPasteConfirmYes')}
        cancelLabel={t('settings.importPasteConfirmNo')}
        loading={importing}
        variant='default'
        onConfirm={runImport}
        onCancel={() => { if (!importing) setConfirmOpen(false) }}
      />
    </section>
  )
}
