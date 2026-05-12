import { useSwaps } from '../state/stickersStore'
import { useI18n } from '../i18n'
import SwapTeamGroup from '../components/SwapTeamGroup'

export default function SwapsPage() {
  const { t } = useI18n()
  const { swapsByTeam, total } = useSwaps()
  const stickerWord = total === 1 ? t('swaps.sticker') : t('swaps.stickers')

  return (
    <div className='flex flex-col h-full'>
      <div className='flex items-center gap-3 px-4 pt-4 pb-3 border-b border-slate-800 shrink-0'>
        <span className='text-3xl'>🔄</span>
        <div>
          <h2 className='text-white font-bold text-lg'>{t('nav.swaps')}</h2>
          <p className='text-slate-400 text-xs'>
            {total} {stickerWord} {t('swaps.toTrade')}
          </p>
        </div>
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
