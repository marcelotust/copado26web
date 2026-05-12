import { Link } from 'react-router-dom'
import { useAlbumProgress } from '../state/stickersStore'
import ProgressBar from './ProgressBar'
import HeaderMenu from './HeaderMenu'
import AppLogo from './AppLogo'

/** @param {{ email?: string, onLogout: () => void }} props */
export default function Header({ email, onLogout }) {
  const { total, collected } = useAlbumProgress()

  return (
    <header className='shrink-0 flex items-center gap-3 px-4 py-2 bg-slate-900/95 backdrop-blur z-40 relative'>
      <Link to='/album' className='shrink-0 px-1 py-2'>
        <AppLogo size='sm' />
      </Link>

      <ProgressBar collected={collected} total={total} />

      <HeaderMenu onLogout={onLogout} email={email} />

      <div className='absolute bottom-0 left-0 right-0 h-px flex'>
        <div className='flex-1' style={{ backgroundColor: '#3B82F6' }} />
        <div className='flex-1' style={{ backgroundColor: '#F43F5E' }} />
        <div className='flex-1' style={{ backgroundColor: '#10B981' }} />
      </div>
    </header>
  )
}
