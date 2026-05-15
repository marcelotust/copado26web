import { useCallback, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import {
  diffQuantityMaps,
  parseAlbumCsv,
  validateAlbumCsvAgainstCatalog,
} from '../lib/albumCsv'
import { useCatalogSnapshot, useReplaceAllQuantities } from '../state/stickersStore'
import ConfirmModal from './ConfirmModal'
import SimpleDialog from './SimpleDialog'
import { reportError } from '../lib/logger'
import { AnalyticsEvent, telemetry } from '../lib/telemetry'

const CSV_ERROR_I18N: Record<string, string> = {
  'csv.empty': 'settings.importErrorEmpty',
  'csv.badHeader': 'settings.importErrorBadHeader',
  'csv.badColumnCount': 'settings.importErrorBadColumnCount',
  'csv.duplicateId': 'settings.importErrorDuplicateId',
  'csv.badId': 'settings.importErrorBadId',
  'csv.badNumber': 'settings.importErrorBadNumber',
  'csv.badQuantity': 'settings.importErrorBadQuantity',
  'csv.badBoolean': 'settings.importErrorBadBoolean',
  'csv.unknownSticker': 'settings.importErrorUnknownSticker',
  'csv.catalogMismatch': 'settings.importErrorCatalogMismatch',
}

export default function SettingsImportSection() {
  const { t } = useI18n()
  const { catalog, quantities } = useCatalogSnapshot()
  const replaceAll = useReplaceAllQuantities()
  const inputRef = useRef<HTMLInputElement>(null)

  const [parseError, setParseError] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importedMap, setImportedMap] = useState<Map<string, number> | null>(null)
  const [diff, setDiff] = useState<ReturnType<typeof diffQuantityMaps> | null>(null)

  const translateCsvError = useCallback(
    (code: string) => {
      const key = CSV_ERROR_I18N[code]
      return key ? t(key) : t('settings.importErrorGeneric')
    },
    [t],
  )

  function onPickFile() {
    setParseError(null)
    inputRef.current?.click()
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setParseError(null)
    let text: string
    try {
      text = await file.text()
    } catch {
      setParseError(t('settings.importErrorRead'))
      return
    }

    const parsed = parseAlbumCsv(text)
    if (!parsed.ok) {
      setParseError(translateCsvError(parsed.error))
      return
    }

    const validated = validateAlbumCsvAgainstCatalog(parsed.rows, catalog)
    if (!validated.ok) {
      setParseError(translateCsvError(validated.error))
      return
    }

    const d = diffQuantityMaps(quantities, validated.quantities)
    setImportedMap(validated.quantities)
    setDiff(d)
    setPreviewOpen(true)
  }

  async function runImport() {
    if (!importedMap) return
    setImporting(true)
    try {
      await replaceAll(importedMap)
      telemetry.track(AnalyticsEvent.ALBUM_IMPORTED, {
        changed: diff?.changedIds ?? 0,
        added: diff?.unitsAdded ?? 0,
        removed: diff?.unitsRemoved ?? 0,
      })
      setConfirmOpen(false)
      setPreviewOpen(false)
      setImportedMap(null)
      setDiff(null)
    } catch (err) {
      reportError('csv import failed', err, { feature: 'settings', action: 'import_csv' })
      setParseError(t('settings.importErrorNetwork'))
    } finally {
      setImporting(false)
    }
  }

  return (
    <section className='flex flex-col gap-2'>
      <input ref={inputRef} type='file' accept='.csv,text/csv' className='hidden' onChange={onFile} />
      <button
        type='button'
        onClick={onPickFile}
        className='px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-left transition-colors'
      >
        {t('settings.importCSV')}
      </button>
      {parseError && <p className='text-amber-400 text-sm'>{parseError}</p>}

      <SimpleDialog
        isOpen={previewOpen}
        title={t('settings.importPreviewTitle')}
        onClose={() => {
          if (importing) return
          setPreviewOpen(false)
        }}
      >
        {diff && (
          <ul className='list-disc pl-5 space-y-2'>
            <li>{t('settings.importDiffChanged').replace('{{n}}', String(diff.changedIds))}</li>
            <li>{t('settings.importDiffAdded').replace('{{n}}', String(diff.unitsAdded))}</li>
            <li>{t('settings.importDiffRemoved').replace('{{n}}', String(diff.unitsRemoved))}</li>
          </ul>
        )}
        <p className='mt-4 text-slate-400'>{t('settings.importOverwriteNote')}</p>
        <div className='mt-6 flex flex-col gap-2'>
          <button
            type='button'
            disabled={importing}
            onClick={() => {
              setPreviewOpen(false)
            }}
            className='py-2.5 rounded-xl font-semibold text-sm bg-slate-700 hover:bg-slate-600 text-white'
          >
            {t('settings.importCancel')}
          </button>
          <button
            type='button'
            disabled={importing}
            onClick={() => {
              setPreviewOpen(false)
              setConfirmOpen(true)
            }}
            className='py-2.5 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-500 text-white'
          >
            {t('settings.importContinue')}
          </button>
        </div>
      </SimpleDialog>

      <ConfirmModal
        isOpen={confirmOpen}
        title={t('settings.importConfirmTitle')}
        description={t('settings.importConfirmDesc')}
        confirmLabel={importing ? t('settings.importing') : t('settings.importConfirmYes')}
        cancelLabel={t('settings.importConfirmNo')}
        loading={importing}
        onConfirm={runImport}
        onCancel={() => !importing && setConfirmOpen(false)}
      />
    </section>
  )
}