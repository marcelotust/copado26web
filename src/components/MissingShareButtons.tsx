import { useI18n } from '../i18n'
import type { MissingGroup } from '../state/stickersStore'
import StickerShareActions from './StickerShareActions'
import { buildMissingShareText } from '../lib/shareText'

type Props = {
  groups: MissingGroup[]
  total: number
  teamName: (code: string) => string
  teamFlag: (code: string) => string
}

export default function MissingShareButtons({ groups, total, teamName, teamFlag }: Props) {
  const { t } = useI18n()
  return (
    <StickerShareActions
      getShareText={() => buildMissingShareText(groups, teamName, teamFlag, total, t)}
      shareLabel={t('missing.share')}
      copiedLabel={t('missing.copied')}
      surface='missing'
    />
  )
}

export { pad } from '../lib/shareText'
