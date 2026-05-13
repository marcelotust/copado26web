import { Link } from 'react-router-dom'
import { useAlbumProgress } from '../state/stickersStore'
import ProgressBar from './ProgressBar'
import HeaderMenu from './HeaderMenu'
import AppLogo from './AppLogo'

type HeaderProps = { email?: string; onLogout: () => void }

export default function Header({ email, onLogout }: HeaderProps) {
  const { total, collected } = useAlbumProgress()

  return (
    <header className='shrink-0 flex items-center gap-3 px-4 py-2 bg-slate-900/95 backdrop-blur z-40 relative'>
      <Link to='/album' className='shrink-0 px-1 py-2'>
        <AppLogo size='sm' />
      </Link>

      <ProgressBar collected={collected} total={total} />

      <Link
        to='/challenges'
        className='shrink-0 flex items-center justify-center w-8 h-8 rounded-lg text-amber-400 hover:bg-amber-500/20 transition-colors text-lg'
        aria-label='Desafios'
      >
        🏆
      </Link>

      <HeaderMenu onLogout={onLogout} email={email} />

      <div className='absolute bottom-0 left-0 right-0 h-px flex'>
        <div className='flex-1' style={{ backgroundColor: '#3B82F6' }} />
        <div className='flex-1' style={{ backgroundColor: '#F43F5E' }} />
        <div className='flex-1' style={{ backgroundColor: '#10B981' }} />
      </div>
    </header>
  )
}
