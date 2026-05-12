import { Link } from 'react-router-dom'
import { useSupabaseProgress } from '../hooks/useSupabaseProgress'
import ProgressBar from './ProgressBar'
import HeaderMenu from './HeaderMenu'
import AppLogo from './AppLogo'

/** @param {{ userId: string, email?: string, onLogout: () => void }} props */
export default function Header({ userId, email, onLogout }) {
  const { total, collected } = useSupabaseProgress(userId)

  return (
    <header className='shrink-0 flex items-center gap-3 px-4 py-2 bg-slate-900/95 backdrop-blur z-40 relative'>
      <Link to='/album' className='shrink-0 px-1 py-2'>
        <AppLogo size='sm' />
      </Link>

      <ProgressBar collected={collected} total={total} />

      <HeaderMenu onLogout={onLogout} email={email} />

      {/* Tricolor accent line */}
      <div className='absolute bottom-0 left-0 right-0 h-px' style={{ background: 'linear-gradient(90deg, #3B82F6, #F43F5E, #10B981)' }} />
    </header>
  )
}
