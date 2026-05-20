import FloatPopups from './FloatPopups'
import FoilGrid from './FoilGrid'
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
  floats: number[]
  removals: number[]
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
  floats,
  removals,
}: StickerCardBackdropProps) {
  const shellStyle = stickerCardShellStyle({ collected, useEscudoSheen, useWideCyanSheen, primary })

  return (
    <div
      className={[
        'absolute inset-0 overflow-hidden flex flex-col z-10 transition-all duration-150',
        'rounded-none',
        collected && !isFoil && 'shadow-lg',
        !isFoil && useEscudoSheen && !collected && 'ring-2 ring-amber-400/55 ring-inset',
        !isFoil && useWideCyanSheen && !collected && 'ring-2 ring-cyan-200/25 ring-inset',
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
        <div
          className='absolute inset-0 pointer-events-none rounded-none'
          style={{
            background: 'linear-gradient(45deg, #f9f9f9 0%, #cbcbcb 22.22%, #808080 28.46%, #ffffff 35.31%, #d2d2d2 40.79%, #969696 56.77%, #f9f9f9 100%)',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'destination-out',
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            padding: 'clamp(2px, 0.8vmin, 8px)',
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
      />

      {isFoil && collected && <FoilGrid />}

      <FloatPopups floats={floats} removals={removals} />

    </div>
  )
}
