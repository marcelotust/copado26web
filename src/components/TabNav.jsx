import { Link, useLocation } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useAuth } from '../hooks/useAuth'
import { useSupabaseProgress } from '../hooks/useSupabaseProgress'

export default function TabNav() {
  const { t } = useI18n()
  const { pathname } = useLocation()
  const { session } = useAuth()
  const { swaps } = useSupabaseProgress(session?.user?.id)

  if (swaps === 0) return null

  return (
    <nav className='shrink-0 flex justify-center gap-1 px-4 py-2 bg-slate-900 border-b border-slate-800'>
      <NavTab to='/album' label={t('nav.album')} active={pathname === '/album' || pathname === '/'} />
      <NavTab to='/swaps' label={t('nav.swaps')} active={pathname === '/swaps'} badge={swaps} />
    </nav>
  )
}

function NavTab({ to, label, active, badge }) {
  return (
    <Link
      to={to}
      className={[
        'flex items-center gap-1.5 px-5 py-1.5 rounded-full text-sm font-semibold transition-colors',
        active
          ? 'bg-blue-600 text-white'
          : 'text-slate-400 hover:text-white hover:bg-slate-800',
      ].join(' ')}
    >
      {label}
      {badge > 0 && (
        <span className='bg-amber-500 text-white text-[9px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-1'>
          {badge}
        </span>
      )}
    </Link>
  )
}
