import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useAlbumProgress } from '../state/stickersStore'
import { FeatureFlag, telemetry } from '../lib/telemetry'
import FatProgressBar from './FatProgressBar'
import HeaderMenu from './HeaderMenu'
import BrandMark from './brand/BrandMark'
import TradeQRModal from './TradeQRModal'
import FriendsHeaderButton from './friends/FriendsHeaderButton'

type HeaderProps = { email?: string; onLogout: () => void }

export default function Header({ email, onLogout }: HeaderProps) {
  const { t } = useI18n()
  const { total, collected } = useAlbumProgress()
  const [tradeQrOpen, setTradeQrOpen] = useState(false)
  const friendsEnabled = import.meta.env.DEV || telemetry.flag(FeatureFlag.FRIENDS_V1)
  const socialEnabled = import.meta.env.DEV || telemetry.flag(FeatureFlag.SOCIAL_V1)

  return (
    <header className='shrink-0 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-slate-900/95 backdrop-blur z-40 relative'>
      <Link to='/dashboard' className='shrink-0 px-1 py-2'>
        <BrandMark variant='card-inline' className='h-8 w-auto' />
      </Link>

      <div className='hidden sm:block flex-1 min-w-0'>
        <FatProgressBar
          pct={total > 0 ? Math.round((collected / total) * 100) : 0}
          color='bg-emerald-500'
          track='bg-slate-800'
          valueLabel={`${collected}/${total}`}
          height='h-6'
        />
      </div>

      <button
        type='button'
        onClick={() => setTradeQrOpen(true)}
        data-onboarding-target='trade-qr-button'
        className='shrink-0 flex items-center gap-1.5 px-2 sm:px-2.5 h-8 rounded-lg text-emerald-400 hover:bg-emerald-500/15 transition-colors text-lg border border-transparent hover:border-emerald-500/20'
        aria-label={t('nav.tradeByQr')}
      >
        <svg className='w-[1.125rem] h-[1.125rem] shrink-0' viewBox='0 0 24 24' fill='currentColor' aria-hidden>
          <path d='M3 3h7v7H3V3zm2 2v3h3V5H5zm9-2h7v7h-7V3zm2 2v3h3V5h-3zM3 14h7v7H3v-7zm2 2v3h3v-3H5zm12-2h2v2h-2v-2zm-4 0h2v2h-2v-2zm2 2h2v2h-2v-2zm-6 4h2v2H9v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zm0-4h2v2h-2v-2z' />
        </svg>
        <span className='hidden sm:inline text-xs font-semibold text-emerald-300/90 max-w-[7.5rem] truncate'>
          {t('nav.tradeByQr')}
        </span>
      </button>

      <Link
        to='/challenges'
        data-onboarding-target='challenges-nav'
        className='shrink-0 flex items-center justify-center w-8 h-8 rounded-lg text-amber-400 hover:bg-amber-500/20 transition-colors text-lg'
        aria-label={t('nav.challenges')}
      >
        🏆
      </Link>

      {socialEnabled && (
        <Link
          to='/ranking'
          className='shrink-0 flex items-center justify-center w-8 h-8 rounded-lg text-indigo-400 hover:bg-indigo-500/20 transition-colors text-lg'
          aria-label='Ranking'
        >
          🏅
        </Link>
      )}

      {friendsEnabled && <FriendsHeaderButton />}

      <TradeQRModal open={tradeQrOpen} onClose={() => setTradeQrOpen(false)} />

      <HeaderMenu onLogout={onLogout} email={email} />

      <div className='absolute bottom-0 left-0 right-0 h-px flex'>
        <div className='flex-1' style={{ backgroundColor: '#3B82F6' }} />
        <div className='flex-1' style={{ backgroundColor: '#F43F5E' }} />
        <div className='flex-1' style={{ backgroundColor: '#10B981' }} />
      </div>
    </header>
  )
}
