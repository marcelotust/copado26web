import { useI18n } from '../i18n'
import { useStickerActions } from '../hooks/useStickerActions'
import { teamColors } from '../utils'
import StickerCardBackdrop from './StickerCardBackdrop'
import ConfirmModal from './ConfirmModal'
import DuplicatesBadge from './DuplicatesBadge'
import type { Sticker } from '../types/database'

type StickerCardProps = {
  sticker: Sticker
  teamCode: string
  /** Album page only: selected stickers occupy 2 columns in the grid */
  albumCell?: 'featured-wide'
}

export default function StickerCard({ sticker, teamCode, albumCell }: StickerCardProps) {
  const { t } = useI18n()
  const {
    qty, popping, floats, removals,
    showRemoveConfirm, handleAdd, handleRemove,
    handleConfirmRemove, handleCancelRemove,
  } = useStickerActions(sticker)
  const collected = qty > 0
  const dupes = qty - 1
  const numLabel = String(sticker.number).padStart(2, '0')
  const { primary, secondary } = teamColors(teamCode)

  const displayLabel = sticker.player_name
    ?? (sticker.is_special && sticker.number === 1 ? t('sticker.shield') : null)
    ?? (sticker.is_special && sticker.number === 13 ? t('sticker.teamPhoto') : null)

  const isFoil = teamCode === 'WAP' || (sticker.is_special && sticker.number === 1)

  const fillsAlbumSpan = albumCell === 'featured-wide'

  const isTeamSquadWide =
    albumCell === 'featured-wide' &&
    sticker.is_special &&
    sticker.number === 13 &&
    teamCode !== 'WAP' &&
    teamCode !== 'FWC' &&
    teamCode !== 'CC'

  const useEscudoSheen = isTeamSquadWide
  const useWideCyanSheen = albumCell === 'featured-wide' && !isTeamSquadWide

  const albumFace = albumCell === 'featured-wide' ? 'featured-wide' : 'default'

  const silhouetteType =
    teamCode === 'FWC' && sticker.number >= 9 && sticker.number <= 19 ? 'team-photo' as const
    : teamCode === 'WAP' && (sticker.number === 0 || sticker.number === 4) ? 'shield' as const
    : teamCode === 'WAP' && (sticker.number === 1 || sticker.number === 2) ? 'trophy' as const
    : teamCode === 'WAP' && sticker.number === 3 ? 'team-photo' as const
    : teamCode === 'WAP' && sticker.number === 5 ? 'ball' as const
    : teamCode === 'WAP' && sticker.number >= 6 && sticker.number <= 8 ? 'trophy' as const
    : sticker.player_name ? 'player' as const
    : sticker.is_special && sticker.number === 1 ? 'shield' as const
    : sticker.is_special && sticker.number === 13 ? 'team-photo' as const
    : 'none' as const

  const n = sticker.number
  const labelColor =
    n >= 2  && n <= 4  ? '#7c3aed'
    : n >= 5  && n <= 7  ? '#ec4899'
    : n >= 8  && n <= 14 ? '#ea580c'
    : '#087c8a'

  return (
    <div
      className={[
        'relative select-none',
        isTeamSquadWide ? 'aspect-[3/2] w-[85%]'
          : fillsAlbumSpan ? 'h-full w-full min-h-0'
          : 'aspect-[2/3]',
        popping ? 'animate-pop' : '',
      ].join(' ')}
    >
      <StickerCardBackdrop
        teamCode={teamCode}
        collected={collected}
        useEscudoSheen={useEscudoSheen}
        useWideCyanSheen={useWideCyanSheen}
        primary={primary}
        secondary={secondary}
        numLabel={numLabel}
        albumFace={albumFace}
        silhouetteType={silhouetteType}
        labelColor={labelColor}
        displayLabel={displayLabel}
        isFoil={isFoil}
        qty={qty}
        floats={floats}
        removals={removals}
        onAdd={handleAdd}
        onRemove={handleRemove}
      />

      <ConfirmModal
        isOpen={showRemoveConfirm}
        title={t('sticker.removeTitle')}
        description={t('sticker.removeDesc')}
        confirmLabel={t('sticker.removeConfirm')}
        cancelLabel={t('sticker.removeCancel')}
        onConfirm={handleConfirmRemove}
        onCancel={handleCancelRemove}
      />

      {collected && dupes > 0 && (
        <DuplicatesBadge dupes={dupes} primary={primary} secondary={secondary} />
      )}
    </div>
  )
}
