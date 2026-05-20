import type { MouseEvent } from 'react'
import FloatPopups from './FloatPopups'
import StickerCardCaptionColumn from './StickerCardCaptionColumn'
import StickerCardSheens from './StickerCardSheens'
import { stickerCardShellStyle } from './stickerCardShellStyle'

type AlbumFace = 'featured-wide' | 'default'

type SilhouetteType = 'player' | 'team-photo' | 'shield' | 'ball' | 'trophy' | 'none'

type StickerCardBackdropProps = {
  teamCode: string
  collected: boolean
  useEscudoSheen: boolean
  useWideCyanSheen: boolean
  primary: string
  secondary: string
  numLabel: string
  albumFace: AlbumFace
  silhouetteType: SilhouetteType
  labelColor: string
  displayLabel: string | null
  isFoil: boolean
  qty: number
  floats: number[]
  removals: number[]
  onAdd: (e: MouseEvent) => void
  onRemove: (e: MouseEvent) => void
}

export default function StickerCardBackdrop({
  teamCode,
  collected,
  useEscudoSheen,
  useWideCyanSheen,
  primary,
  secondary,
  numLabel,
  albumFace,
  silhouetteType,
  labelColor,
  displayLabel,
  isFoil,
  qty,
  floats,
  removals,
  onAdd,
  onRemove,
}: StickerCardBackdropProps) {
  const shellStyle = stickerCardShellStyle({ collected, useEscudoSheen, useWideCyanSheen, primary })

  return (
    <div
      className={[
        'absolute inset-0 overflow-hidden flex flex-col z-10 transition-all duration-150',
        isFoil ? (collected ? 'rounded-none' : 'rounded-xl')
          : collected ? 'shadow-lg rounded-none' : 'rounded-xl',
        !isFoil && useEscudoSheen && 'rounded-2xl ring-2 ring-amber-400/55 ring-inset',
        !isFoil && useWideCyanSheen && 'rounded-2xl ring-2 ring-cyan-200/25 ring-inset',
      ].join(' ')}
      style={isFoil ? undefined : shellStyle}
    >
      <div
        className='absolute inset-0'
        style={{
          background: isFoil
            ? collected
              ? `linear-gradient(135deg, ${primary} 50%, ${secondary} 50%)`
              : `linear-gradient(135deg, ${primary}40 50%, ${secondary}30 50%)`
            : collected
              ? 'linear-gradient(160deg, #9bd9f9 0%, #48baf4 100%)'
              : '#0f172a',
        }}
      />
      {!isFoil && <div
        className='absolute inset-0'
        style={{
          background: collected
            ? `linear-gradient(160deg, ${primary}18 0%, ${secondary}10 100%)`
            : `linear-gradient(160deg, ${primary}20 0%, ${secondary}14 100%)`,
        }}
      />}
      <StickerCardSheens
        useEscudoSheen={useEscudoSheen}
        useWideCyanSheen={useWideCyanSheen}
        primary={primary}
        secondary={secondary}
      />

      {isFoil && collected && (
        <div className='absolute inset-0 pointer-events-none foil-shine' />
      )}

      {isFoil && collected && (
        <div
          className='absolute inset-0 pointer-events-none rounded-none'
          style={{
            background: 'linear-gradient(45deg, #909090 0%, #909090 15%, #ffffff 18%, #ffffff 22%, #888888 25%, #888888 45%, #f5f5f5 48%, #f5f5f5 52%, #909090 55%, #909090 75%, #ffffff 78%, #ffffff 82%, #909090 85%, #909090 100%)',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'destination-out',
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            padding: albumFace === 'featured-wide' ? '10px' : '4px',
          }}
        />
      )}

      <StickerCardCaptionColumn
        teamCode={teamCode}
        collected={collected}
        primary={primary}
        secondary={secondary}
        numLabel={numLabel}
        albumFace={albumFace}
        silhouetteType={silhouetteType}
        labelColor={labelColor}
        displayLabel={displayLabel}
        isFoil={isFoil}
        qty={qty}
        onAdd={onAdd}
        onRemove={onRemove}
      />

      <FloatPopups floats={floats} removals={removals} />

    </div>
  )
}
