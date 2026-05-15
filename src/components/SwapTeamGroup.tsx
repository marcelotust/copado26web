import { useTeam } from '../state/stickersStore'
import { useI18n } from '../i18n'
import StickerCodeGroup from './StickerCodeGroup'
import SwapStickerTile from './SwapStickerTile'
import type { Sticker } from '../types/database'

type SwapTeamGroupProps = {
  teamCode: string
  stickers: Sticker[]
}

export default function SwapTeamGroup({ teamCode, stickers }: SwapTeamGroupProps) {
  const { t } = useI18n()
  const team = useTeam(teamCode)
  const name = team ? t(team.name_key) : teamCode
  const extraCount = stickers.reduce((acc, sticker) => acc + Math.max(sticker.quantity - 1, 0), 0)

  return (
    <StickerCodeGroup
      teamCode={teamCode}
      flag={team?.flag ?? ''}
      name={name}
      count={extraCount}
      countLabel={extraCount === 1 ? t('swaps.sticker') : t('swaps.stickers')}
    >
        {stickers.map((s) => (
          <SwapStickerTile key={s.id} sticker={s} teamCode={teamCode} />
        ))}
    </StickerCodeGroup>
  )
}
