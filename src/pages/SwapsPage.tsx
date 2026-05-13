import { useSwaps, useTeams } from '../state/stickersStore'
import { useI18n } from '../i18n'
import SwapTeamGroup from '../components/SwapTeamGroup'
import SwapsShareButtons from '../components/SwapsShareButtons'

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
      <div className='shrink-0 flex flex-col gap-2 px-4 py-3 bg-slate-900 border-b border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:gap-3'>
        <div className='flex items-center gap-3 min-w-0 flex-1'>
          <span className='text-3xl shrink-0'>🔄</span>
          <div className='min-w-0'>
            <h2 className='text-white font-bold text-lg'>{t('nav.swaps')}</h2>
            <p className='text-slate-400 text-xs'>
              {total} {stickerWord} {t('swaps.toTrade')}
            </p>
          </div>
        </div>
        {total > 0 && (
          <SwapsShareButtons
            groups={swapsByTeam}
            totalExtras={total}
            teamName={teamName}
            teamFlag={teamFlag}
          />
        )}
      </div>

      <div className='flex-1 overflow-y-auto p-3'>
        {swapsByTeam.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-48 text-center gap-3'>
            <span className='text-5xl'>✨</span>
            <p className='text-slate-400 font-semibold'>{t('swaps.empty')}</p>
            <p className='text-slate-600 text-sm'>{t('swaps.emptyDesc')}</p>
          </div>
        ) : (
          <div className='space-y-6'>
            {swapsByTeam.map(({ teamCode, stickers }) => (
              <SwapTeamGroup key={teamCode} teamCode={teamCode} stickers={stickers} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
