import { useI18n } from '../i18n'

export default function CatalogErrorScreen({ error }: { error: Error | null }) {
  const { t } = useI18n()
  const offline = typeof navigator !== 'undefined' && !navigator.onLine

  return (
    <div className='fixed inset-0 bg-slate-950 flex flex-col items-center justify-center gap-4 px-6 text-center'>
      <span className='text-5xl'>{offline ? '📡' : '⚠️'}</span>
      <p className='text-white font-bold text-lg'>
        {offline ? t('errors.offlineTitle') : t('errors.catalogTitle')}
      </p>
      <p className='text-slate-400 text-sm max-w-xs'>
        {offline ? t('errors.offlineDesc') : t('errors.catalogDesc')}
      </p>
      <button
        onClick={() => location.reload()}
        className='mt-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold'
      >
        {t('errors.retry')}
      </button>
      {/* Show raw error only in development — never expose internals in production */}
      {!import.meta.env.PROD && error?.message && (
        <p className='text-slate-600 text-xs font-mono mt-1'>{error.message}</p>
      )}
    </div>
  )
}
