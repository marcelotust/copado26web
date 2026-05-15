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
  /** Album page only: escudo ocupa 2 linhas, plantel 2 colunas no grid */
  albumCell?: 'featured-tall' | 'featured-wide'
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

  const fillsAlbumSpan = albumCell === 'featured-tall' || albumCell === 'featured-wide'

  const isTeamSquadWide =
    albumCell === 'featured-wide' &&
    sticker.is_special &&
    sticker.number === 13 &&
    teamCode !== 'WAP' &&
    teamCode !== 'FWC' &&
    teamCode !== 'CC'

  const useEscudoSheen = albumCell === 'featured-tall' || isTeamSquadWide
  const useWideCyanSheen = albumCell === 'featured-wide' && !isTeamSquadWide

  const albumFace =
    albumCell === 'featured-wide'
      ? 'featured-wide'
      : albumCell === 'featured-tall'
        ? 'featured-tall'
        : 'default'

  const silhouetteType =
    sticker.player_name ? 'player' as const
    : sticker.is_special && sticker.number === 1 ? 'shield' as const
    : sticker.is_special && sticker.number === 13 ? 'team-photo' as const
    : 'none' as const

  return (
    <div
      className={[
        'relative select-none',
        fillsAlbumSpan ? 'h-full w-full min-h-0' : 'aspect-[2/3]',
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
        displayLabel={displayLabel}
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
