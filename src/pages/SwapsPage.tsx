import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSwaps, useTeams } from '../state/stickersStore'
import { useI18n } from '../i18n'
import SwapTeamGroup from '../components/SwapTeamGroup'
import SwapsShareButtons from '../components/SwapsShareButtons'
import StickerListPageHeader from '../components/StickerListPageHeader'
import TradeQRModal from '../components/TradeQRModal'

export default function SwapsPage() {
  const { t } = useI18n()
  const [scanOpen, setScanOpen] = useState(false)
  const teams = useTeams()
  const { swapsByTeam, total } = useSwaps()
  const stickerWord = total === 1 ? t('swaps.sticker') : t('swaps.stickers')

  function teamName(code: string): string {
    const team = teams.find(team => team.code === code)
    return team ? t(team.name_key) : code
  }

  function teamFlag(code: string): string {
    return teams.find(team => team.code === code)?.flag ?? ''
  }

  return (
    <div className='flex flex-col h-full'>
      <StickerListPageHeader
        title={t('nav.swaps')}
        icon='📦'
        accentColor='#F43F5E'
        onboardingTarget='swaps-header'
        summary={(
          <>
            <span className='font-bold text-white'>{total}</span>{' '}
            {stickerWord} {t('swaps.toTrade')}
          </>
        )}
        actions={total > 0 ? (
          <SwapsShareButtons groups={swapsByTeam} totalExtras={total} teamName={teamName} teamFlag={teamFlag} />
        ) : undefined}
      />

      <div className='flex-1 overflow-y-auto'>
        {swapsByTeam.length === 0 ? (
          <div className='flex min-h-full flex-col items-center justify-center gap-3 px-6 py-10 text-center'>
            <span className='text-5xl'>✨</span>
            <p className='font-semibold text-slate-300'>{t('swaps.empty')}</p>
            <p className='text-sm text-slate-500'>{t('swaps.emptyDesc')}</p>
          </div>
        ) : (
          <div className='mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 py-4 sm:px-4'>
            <div className='flex flex-wrap gap-2'>
              <button
                type='button'
                onClick={() => setScanOpen(true)}
                className='inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20'
              >
                <svg className='h-4 w-4' viewBox='0 0 24 24' fill='currentColor' aria-hidden>
                  <path d='M3 3h7v7H3V3zm2 2v3h3V5H5zm9-2h7v7h-7V3zm2 2v3h3V5h-3zM3 14h7v7H3v-7zm2 2v3h3v-3H5zm12-2h2v2h-2v-2zm-4 0h2v2h-2v-2zm2 2h2v2h-2v-2zm-6 4h2v2H9v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zm0-4h2v2h-2v-2z' />
                </svg>
                {t('trade.scanTitle')}
              </button>
              <Link
                to='/trading-partners'
                className='inline-flex items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-sm font-semibold text-indigo-300 transition-colors hover:bg-indigo-500/20'
              >
                <span aria-hidden>🤝</span>
                {t('tradingPartners.findPartners')}
              </Link>
            </div>
            {swapsByTeam.map(({ teamCode, stickers }) => (
              <SwapTeamGroup key={teamCode} teamCode={teamCode} stickers={stickers} />
            ))}
          </div>
        )}
      </div>

      <TradeQRModal open={scanOpen} onClose={() => setScanOpen(false)} initialTab='scan' />
    </div>
  )
}
