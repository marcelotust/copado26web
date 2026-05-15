import { useState } from 'react'
import { useI18n } from '../i18n'
import { buildAlbumCsv } from '../lib/albumCsv'
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
  const { catalog, quantities } = useCatalogSnapshot()
  const [exporting, setExporting] = useState(false)

  function handleExportCSV() {
    setExporting(true)
    try {
      downloadCsv(buildAlbumCsv(catalog, quantities))
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
