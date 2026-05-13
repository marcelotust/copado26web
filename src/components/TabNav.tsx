import { useLocation } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useAlbumProgress } from '../state/stickersStore'
import NavTab from './NavTab'

export default function TabNav() {
  const { t } = useI18n()
  const { pathname } = useLocation()
  const { swaps } = useAlbumProgress()

  return (
    <nav className='shrink-0 relative flex justify-center gap-1 px-4 py-2 bg-slate-900'>
      <NavTab to='/dashboard'  label={t('nav.home')}       active={pathname === '/dashboard' || pathname === '/'} color='#F59E0B' />
      <NavTab to='/album'      label={t('nav.album')}      active={pathname === '/album'}                         color='#3B82F6' />
      <NavTab to='/missing'    label={t('nav.missing')}    active={pathname === '/missing'}                       color='#10B981' />
      <NavTab to='/swaps'      label={t('nav.swaps')}      active={pathname === '/swaps'} badge={swaps > 0 ? swaps : undefined} color='#F43F5E' />
      <NavTab to='/challenges' label={t('nav.challenges')} active={pathname === '/challenges'}                    color='#F59E0B' />

      {/* 5-segment accent line */}
      <div className='absolute bottom-0 left-0 right-0 h-px flex'>
        <div className='flex-1' style={{ backgroundColor: '#F59E0B' }} />
        <div className='flex-1' style={{ backgroundColor: '#3B82F6' }} />
        <div className='flex-1' style={{ backgroundColor: '#F43F5E' }} />
        <div className='flex-1' style={{ backgroundColor: '#10B981' }} />
        <div className='flex-1' style={{ backgroundColor: '#F59E0B' }} />
      </div>
    </nav>
  )
}
