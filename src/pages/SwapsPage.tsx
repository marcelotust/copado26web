import { Link } from 'react-router-dom'
import { useSwaps, useTeams } from '../state/stickersStore'
import { useI18n } from '../i18n'
import SwapTeamGroup from '../components/SwapTeamGroup'
import SwapsShareButtons from '../components/SwapsShareButtons'
import StickerListPageHeader from '../components/StickerListPageHeader'

export default function SwapsPage() {
  const { t } = useI18n()
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
        icon='🔄'
        accentColor='#F43F5E'
        onboardingTarget='swaps-header'
        summary={(
          <>
            <span className='font-bold text-white'>{total}</span>{' '}
            {stickerWord} {t('swaps.toTrade')}
          </>
        )}
        actions={total > 0 ? (
          <div className='flex items-center gap-2'>
            <SwapsShareButtons groups={swapsByTeam} totalExtras={total} teamName={teamName} teamFlag={teamFlag} />
            <Link
              to='/trading-partners'
              className='shrink-0 flex items-center gap-1.5 px-2 sm:px-2.5 h-8 rounded-lg text-indigo-400 hover:bg-indigo-500/15 border border-transparent hover:border-indigo-500/20 transition-colors text-xs font-semibold'
            >
              {t('tradingPartners.findPartners')}
            </Link>
          </div>
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
            {swapsByTeam.map(({ teamCode, stickers }) => (
              <SwapTeamGroup key={teamCode} teamCode={teamCode} stickers={stickers} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
