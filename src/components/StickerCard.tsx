import { useI18n } from '../i18n'
import { useStickerActions } from '../hooks/useStickerActions'
import { teamColors } from '../utils'
import StickerButtons from './StickerButtons'
import StickerFace from './StickerFace'
import ConfirmModal from './ConfirmModal'
import DuplicatesBadge from './DuplicatesBadge'
import FloatPopups from './FloatPopups'
import type { Sticker } from '../types/database'

const PANINI_BLUE = '#1a56c4'

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
  const dupes     = qty - 1
  const numLabel  = String(sticker.number).padStart(2, '0')
  const { primary, secondary } = teamColors(teamCode)

  const displayLabel = sticker.player_name
    ?? (sticker.is_special && sticker.number === 1  ? t('sticker.shield')    : null)
    ?? (sticker.is_special && sticker.number === 13 ? t('sticker.teamPhoto') : null)

  const fillsAlbumSpan = albumCell === 'featured-tall' || albumCell === 'featured-wide'

  /** Plantel (#13) em equipas nacionais: layout wide + findo âmbar do escudo. Secções virtuais sem tratamento. */
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

  return (
    <div
      className={[
        'relative select-none',
        fillsAlbumSpan ? 'h-full w-full min-h-0' : 'aspect-[2/3]',
        popping ? 'animate-pop' : '',
      ].join(' ')}
    >
      <div
        className={[
          'absolute inset-0 overflow-hidden flex flex-col z-10 transition-all duration-150',
          collected ? 'shadow-lg rounded-none' : 'rounded-xl',
          useEscudoSheen && 'rounded-2xl ring-2 ring-amber-400/55 ring-inset',
          useWideCyanSheen && 'rounded-2xl ring-2 ring-cyan-200/25 ring-inset',
        ].join(' ')}
        style={collected
          ? {
              boxShadow: useEscudoSheen
                ? `0 0 0 3px ${primary}, 0 0 0 6px rgba(251,191,36,0.35), 0 8px 28px ${primary}40`
                : useWideCyanSheen
                  ? `0 0 0 3px ${primary}, 0 0 0 5px rgba(165,243,252,0.2), 0 8px 28px ${primary}38`
                  : `0 0 0 3px ${primary}, 0 4px 20px ${primary}35`,
            }
          : {
              boxShadow: useEscudoSheen
                ? `0 0 0 1px ${primary}55, inset 0 0 0 1px rgba(251,191,36,0.25)`
                : useWideCyanSheen
                  ? `0 0 0 1px ${primary}50, inset 0 0 0 1px rgba(165,243,252,0.12)`
                  : `0 0 0 1px ${primary}50`,
            }}
      >
        <div className='absolute inset-0 bg-slate-900' />
        <div
          className='absolute inset-0'
          style={{
            background: collected
              ? `linear-gradient(160deg, ${primary}20 0%, ${secondary}14 100%)`
              : `linear-gradient(160deg, ${primary}10 0%, ${secondary}08 100%)`,
          }}
        />
        {useEscudoSheen && (
          <div
            className='pointer-events-none absolute inset-0 opacity-[0.14]'
            style={{
              background: `radial-gradient(circle at 30% 20%, ${primary}, transparent 55%), radial-gradient(circle at 80% 90%, ${secondary}, transparent 50%)`,
            }}
          />
        )}
        {useWideCyanSheen && (
          <div
            className='pointer-events-none absolute inset-0 opacity-[0.18]'
            style={{
              background: `radial-gradient(ellipse 90% 70% at 50% 15%, ${primary}99, transparent 58%), radial-gradient(ellipse 65% 55% at 85% 100%, ${secondary}aa, transparent 55%), linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.04) 50%, transparent 60%)`,
            }}
          />
        )}

        <div className='relative z-10 flex flex-col h-full min-h-0'>
          <StickerFace
            numLabel={numLabel}
            teamCode={teamCode}
            collected={collected}
            primary={primary}
            secondary={secondary}
            albumFace={albumFace}
          />

          <div
            className='mx-1.5 mb-1 shrink-0 rounded-lg px-2 py-1 text-center'
            style={{ background: collected ? PANINI_BLUE : `${primary}25` }}
          >
            <p
              className='text-[11px] font-bold leading-tight truncate'
              style={{ color: collected ? '#fff' : '#94a3b8' }}
              title={displayLabel ?? teamCode}
            >
              {displayLabel ?? teamCode}
            </p>
          </div>

          <StickerButtons qty={qty} collected={collected} onAdd={handleAdd} onRemove={handleRemove} />
        </div>

        <FloatPopups floats={floats} removals={removals} />
      </div>

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
