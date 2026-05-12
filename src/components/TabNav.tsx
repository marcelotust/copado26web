import { Link, useLocation } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useAlbumProgress } from '../state/stickersStore'

export default function TabNav() {
  const { t } = useI18n()
  const { pathname } = useLocation()
  const { swaps } = useAlbumProgress()

  return (
    <nav className='shrink-0 relative flex justify-center gap-1 px-4 py-2 bg-slate-900'>
      <NavTab to='/album'   label={t('nav.album')}   active={pathname === '/album' || pathname === '/'} color='#3B82F6' />
      <NavTab to='/missing' label={t('nav.missing')} active={pathname === '/missing'}                   color='#10B981' />
      <NavTab to='/swaps'   label={t('nav.swaps')}   active={pathname === '/swaps'} badge={swaps > 0 ? swaps : undefined} color='#F43F5E' />

      {/* Tricolor accent line — 3 solid segments */}
      <div className='absolute bottom-0 left-0 right-0 h-px flex'>
        <div className='flex-1' style={{ backgroundColor: '#3B82F6' }} />
        <div className='flex-1' style={{ backgroundColor: '#F43F5E' }} />
        <div className='flex-1' style={{ backgroundColor: '#10B981' }} />
      </div>
    </nav>
  )
}

type NavTabProps = {
  to: string
  label: string
  active: boolean
  color: string
  badge?: number
}

function NavTab({ to, label, active, color, badge }: NavTabProps) {
  return (
    <Link
      to={to}
      className={[
        'flex items-center gap-1.5 px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-150',
        active ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800',
      ].join(' ')}
      style={active ? { backgroundColor: color } : undefined}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span
          className='text-white text-[9px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-1'
          style={{ backgroundColor: color, filter: 'brightness(0.75)' }}
        >
          {badge}
        </span>
      )}
    </Link>
  )
}
