import { useCallback, useEffect, useState } from 'react'
import { useI18n } from '../i18n'
import { diffQuantityMaps, parseAlbumCsv, validateAlbumCsvAgainstCatalog } from '../lib/albumCsv'
import { listAlbumBackups, type AlbumBackupEntry } from '../lib/albumBackupStorage'
import { useCatalogSnapshot, useReplaceAllQuantities } from '../state/stickersStore'
import ConfirmModal from './ConfirmModal'
import SimpleDialog from './SimpleDialog'

type SettingsSavePointsSectionProps = {
  userId: string
}

export default function SettingsSavePointsSection({ userId }: SettingsSavePointsSectionProps) {
  const { t } = useI18n()
  const { catalog, quantities } = useCatalogSnapshot()
  const replaceAll = useReplaceAllQuantities()

  const [items, setItems] = useState<AlbumBackupEntry[]>([])
  const [diffEntry, setDiffEntry] = useState<AlbumBackupEntry | null>(null)
  const [diffStats, setDiffStats] = useState<ReturnType<typeof diffQuantityMaps> | null>(null)
  const [restoreEntry, setRestoreEntry] = useState<AlbumBackupEntry | null>(null)
  const [restoring, setRestoring] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(() => {
    setItems(listAlbumBackups(userId))
  }, [userId])

  useEffect(() => {
    reload()
  }, [reload])

  function openDiff(entry: AlbumBackupEntry) {
    setError(null)
    const parsed = parseAlbumCsv(entry.csv)
    if (!parsed.ok) {
      setError(t('settings.savePointsDiffError'))
      return
    }
    const v = validateAlbumCsvAgainstCatalog(parsed.rows, catalog)
    if (!v.ok) {
      setError(t('settings.savePointsDiffError'))
      return
    }
    setDiffStats(diffQuantityMaps(quantities, v.quantities))
    setDiffEntry(entry)
  }

  async function confirmRestore() {
    if (!restoreEntry) return
    const parsed = parseAlbumCsv(restoreEntry.csv)
    if (!parsed.ok) {
      setError(t('settings.savePointsDiffError'))
      return
    }
    const v = validateAlbumCsvAgainstCatalog(parsed.rows, catalog)
    if (!v.ok) {
      setError(t('settings.savePointsDiffError'))
      return
    }
    setRestoring(true)
    try {
      await replaceAll(v.quantities)
      setRestoreEntry(null)
      reload()
    } catch (e) {
      console.error('[restore]', e)
      setError(t('settings.importErrorNetwork'))
    } finally {
      setRestoring(false)
    }
  }

  return (
    <section className='flex flex-col gap-3'>
      <h2 className='text-sm font-semibold text-slate-400 uppercase tracking-wide'>
        {t('settings.savePointsTitle')}
      </h2>
      <p className='text-slate-500 text-xs leading-relaxed'>{t('settings.savePointsHint')}</p>

      {error && <p className='text-amber-400 text-sm'>{error}</p>}

      {items.length === 0 ? (
        <p className='text-slate-500 text-sm'>{t('settings.savePointsEmpty')}</p>
      ) : (
        <ul className='flex flex-col gap-2'>
          {items.map(entry => (
            <li
              key={entry.date}
              className='flex flex-wrap items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2'
            >
              <div className='flex-1 min-w-[140px]'>
                <p className='text-white text-sm font-medium'>{entry.date}</p>
                <p className='text-slate-500 text-xs'>
                  {new Date(entry.savedAt).toLocaleString(undefined, {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
              <button
                type='button'
                onClick={() => openDiff(entry)}
                className='px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold'
              >
                {t('settings.savePointsDiff')}
              </button>
              <button
                type='button'
                onClick={() => {
                  setError(null)
                  setRestoreEntry(entry)
                }}
                className='px-3 py-1.5 rounded-lg bg-amber-700/50 hover:bg-amber-700/70 text-amber-100 text-xs font-semibold border border-amber-800/60'
              >
                {t('settings.savePointsRestore')}
              </button>
            </li>
          ))}
        </ul>
      )}

      <SimpleDialog
        isOpen={!!diffEntry}
        title={t('settings.savePointsDiffTitle')}
        onClose={() => {
          setDiffEntry(null)
          setDiffStats(null)
        }}
      >
        {diffEntry && (
          <p className='text-slate-400 mb-3'>
            {t('settings.savePointsDiffFor').replace('{{date}}', diffEntry.date)}
          </p>
        )}
        {diffStats && (
          <ul className='list-disc pl-5 space-y-2'>
            <li>{t('settings.importDiffChanged').replace('{{n}}', String(diffStats.changedIds))}</li>
            <li>{t('settings.importDiffAdded').replace('{{n}}', String(diffStats.unitsAdded))}</li>
            <li>{t('settings.importDiffRemoved').replace('{{n}}', String(diffStats.unitsRemoved))}</li>
          </ul>
        )}
      </SimpleDialog>

      <ConfirmModal
        isOpen={!!restoreEntry}
        title={t('settings.savePointsRestoreTitle')}
        description={
          restoreEntry
            ? t('settings.savePointsRestoreDesc').replace('{{date}}', restoreEntry.date)
            : undefined
        }
        confirmLabel={restoring ? t('settings.savePointsRestoring') : t('settings.savePointsRestoreYes')}
        cancelLabel={t('settings.savePointsRestoreNo')}
        loading={restoring}
        onConfirm={confirmRestore}
        onCancel={() => !restoring && setRestoreEntry(null)}
      />
    </section>
  )
}
