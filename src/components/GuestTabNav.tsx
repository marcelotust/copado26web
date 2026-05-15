import { useI18n } from '../i18n'
import type { PaywallReason } from '../contexts/PaywallContext'

type Props = { onRestrictedClick: (reason: PaywallReason) => void }

export default function GuestTabNav({ onRestrictedClick }: Props) {
  const { t } = useI18n()
  const restricted = () => onRestrictedClick('tab_click')

  return (
    <nav className='shrink-0 relative flex justify-center gap-1 px-4 py-2 bg-slate-900'>
      <span
        className='flex items-center gap-1.5 px-5 py-1.5 rounded-full text-sm font-semibold text-white'
        style={{ backgroundColor: '#3B82F6' }}
      >
        {t('nav.album')}
      </span>
      {(['nav.home', 'nav.missing', 'nav.swaps'] as const).map(key => (
        <button
          key={key}
          onClick={restricted}
          className='flex items-center gap-1.5 px-5 py-1.5 rounded-full text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-150'
        >
          {t(key)}
        </button>
      ))}
      <div className='absolute bottom-0 left-0 right-0 h-px flex'>
        <div className='flex-1' style={{ backgroundColor: '#F59E0B' }} />
        <div className='flex-1' style={{ backgroundColor: '#3B82F6' }} />
        <div className='flex-1' style={{ backgroundColor: '#F43F5E' }} />
        <div className='flex-1' style={{ backgroundColor: '#10B981' }} />
      </div>
    </nav>
  )
}
