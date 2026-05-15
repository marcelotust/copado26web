import { useI18n } from '../i18n'
import { useStickerActions } from '../hooks/useStickerActions'
import { pad } from '../lib/shareText'
import { readableTeamAccent, teamColors } from '../utils'
import type { Sticker } from '../types/database'
import ConfirmModal from './ConfirmModal'
import StickerButtons from './StickerButtons'

type SwapStickerTileProps = {
  sticker: Sticker
  teamCode: string
}

export default function SwapStickerTile({ sticker, teamCode }: SwapStickerTileProps) {
  const { t } = useI18n()
  const { primary, secondary } = teamColors(teamCode)
  const accent = readableTeamAccent(teamCode)
  const {
    qty,
    popping,
    showRemoveConfirm,
    handleAdd,
    handleRemove,
    handleConfirmRemove,
    handleCancelRemove,
  } = useStickerActions(sticker)
  const numLabel = pad(sticker.number)
  const extras = Math.max(qty - 1, 1)
  const label = `${teamCode} ${numLabel}`

  return (
    <div
      className={[
        'relative min-h-[5.5rem] overflow-hidden rounded-lg border bg-slate-950/45',
        popping ? 'animate-pop' : '',
      ].join(' ')}
      style={{
        borderColor: `${primary}35`,
        backgroundImage: `linear-gradient(155deg, ${primary}18, ${secondary}10 70%, rgba(15, 23, 42, 0.72))`,
      }}
      title={label}
    >
      <div className='flex min-h-[4rem] flex-col px-2 py-2'>
        <div className='flex items-start justify-between gap-1'>
          <span className='text-[0.65rem] font-bold leading-none text-slate-400'>
            {teamCode}
          </span>
          <span
            className='rounded border px-1.5 py-0.5 text-[0.625rem] font-black leading-none'
            style={{
              borderColor: `${accent}55`,
              color: accent,
              backgroundColor: `${accent}18`,
            }}
          >
            +{extras}
          </span>
        </div>
        <span className='mt-1 block font-mono text-xl font-black leading-none text-white'>
          {numLabel}
        </span>
      </div>

      <StickerButtons qty={qty} collected onAdd={handleAdd} onRemove={handleRemove} />

      <ConfirmModal
        isOpen={showRemoveConfirm}
        title={t('sticker.removeTitle')}
        description={t('sticker.removeDesc')}
        confirmLabel={t('sticker.removeConfirm')}
        cancelLabel={t('sticker.removeCancel')}
        onConfirm={handleConfirmRemove}
        onCancel={handleCancelRemove}
      />
    </div>
  )
}
