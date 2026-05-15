import AlbumPage from '../pages/AlbumPage'
import Sidebar from './Sidebar'
import GuestTabNav from './GuestTabNav'
import { useStickersStatus } from '../state/stickersStore'
import type { PaywallReason } from '../contexts/PaywallContext'

type Props = {
  section: string
  onSelect: (code: string) => void
  onRestrictedClick: (reason: PaywallReason) => void
}

export default function GuestAlbumContent({ section, onSelect, onRestrictedClick }: Props) {
  const { status, error } = useStickersStatus()

  if (status === 'idle' || status === 'loading') {
    return (
      <div className='flex flex-1 items-center justify-center text-slate-500 text-sm'>
        Carregando álbum…
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className='flex flex-1 flex-col items-center justify-center gap-2 text-slate-500 text-sm px-6 text-center'>
        <span className='text-2xl'>😕</span>
        <p>Não foi possível carregar o álbum.</p>
        {error && <p className='text-xs text-slate-600'>{error.message}</p>}
      </div>
    )
  }

  return (
    <>
      <GuestTabNav onRestrictedClick={onRestrictedClick} />
      <div className='flex flex-1 min-h-0'>
        <Sidebar selected={section} onSelect={onSelect} />
        <main className='flex-1 min-w-0 overflow-hidden'>
          <AlbumPage sectionCode={section} />
        </main>
      </div>
    </>
  )
}
