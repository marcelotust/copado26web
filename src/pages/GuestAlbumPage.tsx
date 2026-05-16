import { useState, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { GuestStickersProvider } from '../state/GuestStickersProvider'
import { PaywallContext, type PaywallReason } from '../contexts/PaywallContext'
import GuestAlbumContent from '../components/GuestAlbumContent'
import GuestPaywallModal from '../components/GuestPaywallModal'
import AppLogo from '../components/AppLogo'
import { useI18n } from '../i18n'
import { AnalyticsEvent, telemetry } from '../lib/telemetry'

const DEFAULT_SECTION = 'BRA'

export default function GuestAlbumPage() {
  const { t } = useI18n()
  const [section, setSection] = useState(DEFAULT_SECTION)
  const [paywallOpen, setPaywallOpen] = useState(false)

  useEffect(() => {
    telemetry.track(AnalyticsEvent.GUEST_ALBUM_VIEWED)
  }, [])

  const openPaywall = useCallback((reason: PaywallReason) => {
    if (reason === 'sticker_toggle') {
      telemetry.track(AnalyticsEvent.GUEST_STICKER_TAPPED)
    }
    telemetry.track(AnalyticsEvent.PAYWALL_SHOWN, { reason })
    setPaywallOpen(true)
  }, [])

  const closePaywall = useCallback(() => {
    setPaywallOpen(false)
  }, [])

  return (
    <PaywallContext.Provider value={openPaywall}>
      <GuestStickersProvider onPaywall={openPaywall}>
        <div className='fixed inset-0 flex flex-col bg-slate-950 text-white'>

          <header className='shrink-0 flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800'>
            <Link to='/' className='flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm'>
              <span aria-hidden='true'>←</span>
              <AppLogo size='sm' />
            </Link>
            <Link
              to='/login'
              className='px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors'
            >
              {t('guest.signIn')}
            </Link>
          </header>

          <GuestAlbumContent
            section={section}
            onSelect={setSection}
            onRestrictedClick={openPaywall}
          />
        </div>

        {paywallOpen && <GuestPaywallModal onClose={closePaywall} />}
      </GuestStickersProvider>
    </PaywallContext.Provider>
  )
}
