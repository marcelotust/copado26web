import { useI18n } from '../i18n'
import type { SwapGroup } from '../state/stickersStore'
import StickerShareActions from './StickerShareActions'
import { buildSwapsShareText } from '../lib/shareText'

type Props = {
  groups: SwapGroup[]
  totalExtras: number
  teamName: (code: string) => string
  teamFlag: (code: string) => string
}

export default function SwapsShareButtons({ groups, totalExtras, teamName, teamFlag }: Props) {
  const { t } = useI18n()
  return (
    <StickerShareActions
      getShareText={() => buildSwapsShareText(groups, teamName, teamFlag, totalExtras, t)}
      shareLabel={t('swaps.share')}
      copiedLabel={t('swaps.copied')}
      surface='swaps'
    />
  )
}
