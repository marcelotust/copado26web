import { useSupabaseProgress } from '../hooks/useSupabaseProgress'
import { useI18n } from '../i18n'
import ProgressBar from './ProgressBar'
import HeaderMenu from './HeaderMenu'

/** @param {{ userId: string, onLogout: () => void }} props */
export default function Header({ userId, onLogout }) {
  const { total, collected } = useSupabaseProgress(userId)
  const { t } = useI18n()

  return (
    <header className='shrink-0 flex items-center gap-3 px-4 py-2.5 bg-slate-900/95 backdrop-blur border-b border-slate-800 z-10'>
      <div className='flex items-center gap-2 px-2 lg:px-3 py-3 shrink-0'>
        <span className='text-xl shrink-0'>⚽</span>
        <div className='lg:block min-w-0'>
          <p className='text-white font-black text-x leading-none tracking-tight'>
            COPADO26
          </p>
          <p className='text-slate-600 text-[9px] leading-none mt-0.5'>
            {t('appSubtitle')}
          </p>
        </div>
      </div>

      <ProgressBar collected={collected} total={total} />

      <HeaderMenu onLogout={onLogout} />
    </header>
  )
}
