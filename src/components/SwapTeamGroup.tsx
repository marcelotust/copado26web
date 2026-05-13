import { useTeam } from '../state/stickersStore'
import { teamColors } from '../utils'
import { useI18n } from '../i18n'
import StickerCard from './StickerCard'
import type { Sticker } from '../types/database'

type SwapTeamGroupProps = {
  teamCode: string
  stickers: Sticker[]
}

export default function SwapTeamGroup({ teamCode, stickers }: SwapTeamGroupProps) {
  const { t } = useI18n()
  const team = useTeam(teamCode)
  const { primary, secondary } = teamColors(teamCode)
  const name = team ? t(team.name_key) : teamCode
  const dupeCount = stickers.length

  return (
    <div>
      <div className='flex items-center gap-2 mb-1'>
        <span className='text-lg'>{team?.flag ?? '🏳️'}</span>
        <span className='font-bold text-sm text-white truncate'>{name}</span>
        <span className='text-slate-500 text-xs shrink-0'>
          · {dupeCount} {t('swaps.dupes')}
        </span>
        <span
          className='ml-auto font-bold text-xs shrink-0'
          style={{ color: primary }}
        >
          {teamCode}
        </span>
      </div>

      <div
        className='h-0.5 rounded mb-2'
        style={{ background: `linear-gradient(to right, ${primary}, ${secondary})` }}
      />

      <div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2'>
        {stickers.map((s) => (
          <StickerCard key={s.id} sticker={s} teamCode={teamCode} />
        ))}
      </div>
    </div>
  )
}
