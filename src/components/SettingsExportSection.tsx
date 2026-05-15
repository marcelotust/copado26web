import { useState } from 'react'
import { useI18n } from '../i18n'
import { buildAlbumCsv } from '../lib/albumCsv'
import { useFeedback } from '../contexts/FeedbackContext'
import { errorCodeFrom, reportError } from '../lib/logger'
import { AnalyticsEvent, telemetry } from '../lib/telemetry'
import { useCatalogSnapshot } from '../state/stickersStore'

function downloadCsv(csv: string) {
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'meualbum2026.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export default function SettingsExportSection() {
  const { t } = useI18n()
  const feedback = useFeedback()
  const { catalog, quantities } = useCatalogSnapshot()
  const [exporting, setExporting] = useState(false)

  function handleExportCSV() {
    setExporting(true)
    try {
      const csv = buildAlbumCsv(catalog, quantities)
      const rowCount = Math.max(0, csv.split('\n').length - 1)
      downloadCsv(csv)
      telemetry.track(AnalyticsEvent.EXPORT_CSV_COMPLETED, { row_count: rowCount })
      feedback.success('feedback.exportSuccess')
    } catch (err) {
      const code = errorCodeFrom(err)
      reportError('csv export failed', err, { feature: 'settings', action: 'export_csv', error_code: code })
      telemetry.track(AnalyticsEvent.EXPORT_CSV_FAILED, { error_code: code })
      feedback.error('feedback.exportFailed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <section className='flex flex-col gap-2'>
      <h2 className='text-sm font-semibold text-slate-400 uppercase tracking-wide'>
        {t('settings.data')}
      </h2>
      <button
        onClick={handleExportCSV}
        disabled={exporting}
        className='px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-left transition-colors disabled:opacity-50'
      >
        {exporting ? t('settings.exportingCSV') : t('settings.exportCSV')}
      </button>
    </section>
  )
}
