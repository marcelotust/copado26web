import { Link, useLocation } from 'react-router-dom'
import { useI18n } from '../i18n'

export default function TabNav() {
  const { t } = useI18n()
  const { pathname } = useLocation()

  const tabs = [
    { to: '/album', label: t('nav.album') },
    { to: '/swaps', label: t('nav.swaps') },
  ]

  return (
    <nav className='shrink-0 flex justify-center gap-1 px-4 py-2 bg-slate-900 border-b border-slate-800'>
      {tabs.map(({ to, label }) => {
        const active = pathname === to || (to === '/album' && pathname === '/')
        return (
          <Link
            key={to}
            to={to}
            className={[
              'px-5 py-1.5 rounded-full text-sm font-semibold transition-colors',
              active
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800',
            ].join(' ')}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
