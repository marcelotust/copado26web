import { useLocation } from 'react-router-dom'
import { useI18n } from '../i18n'
import { AnalyticsEvent, telemetry } from '../lib/telemetry'
import { useAlbumProgress } from '../state/stickersStore'
import NavTab from './NavTab'

export default function TabNav() {
  const { t } = useI18n()
  const { pathname } = useLocation()
  const { swaps } = useAlbumProgress()
  const trackTab = (tab: string) => {
    telemetry.track(AnalyticsEvent.NAV_TAB_SELECTED, { tab })
  }

  return (
    <nav className='shrink-0 relative flex justify-center gap-1 px-4 py-2 bg-slate-900'>
      <NavTab to='/dashboard' label={t('nav.home')}    active={pathname === '/dashboard' || pathname === '/'} color='#F59E0B' onNavigate={() => trackTab('dashboard')} />
      <NavTab to='/album'     label={t('nav.album')}   active={pathname === '/album'}                         color='#3B82F6' onNavigate={() => trackTab('album')} />
      <NavTab to='/missing'   label={t('nav.missing')} active={pathname === '/missing'}                       color='#10B981' onboardingTarget='missing-tab' onNavigate={() => trackTab('missing')} />
      <NavTab to='/swaps'     label={t('nav.swaps')}   active={pathname === '/swaps'} badge={swaps > 0 ? swaps : undefined} color='#F43F5E' onNavigate={() => trackTab('swaps')} />

      {/* Quadricolor accent line */}
      <div className='absolute bottom-0 left-0 right-0 h-px flex'>
        <div className='flex-1' style={{ backgroundColor: '#F59E0B' }} />
        <div className='flex-1' style={{ backgroundColor: '#3B82F6' }} />
        <div className='flex-1' style={{ backgroundColor: '#F43F5E' }} />
        <div className='flex-1' style={{ backgroundColor: '#10B981' }} />
      </div>
    </nav>
  )
}
