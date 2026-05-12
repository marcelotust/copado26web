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
}

export default function StickerCard({ sticker, teamCode }: StickerCardProps) {
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

  return (
    <div className={['relative select-none aspect-[2/3]', popping ? 'animate-pop' : ''].join(' ')}>
      <div
        className={[
          'absolute inset-0 overflow-hidden flex flex-col z-10 transition-all duration-150',
          collected ? 'shadow-lg rounded-none' : 'rounded-xl',
        ].join(' ')}
        style={collected
          ? { boxShadow: `0 0 0 3px ${primary}, 0 4px 20px ${primary}35` }
          : { boxShadow: `0 0 0 1px ${primary}50` }}
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

        <div className='relative z-10 flex flex-col h-full'>
          <StickerFace
            numLabel={numLabel}
            teamCode={teamCode}
            collected={collected}
            primary={primary}
            secondary={secondary}
          />

          <div
            className='mx-1.5 mb-1 rounded-lg px-2 py-1 text-center'
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
