// Corner stack + count badge rendered on the top-right of a collected sticker
// that has at least one duplicate.

const CORNER_LAYERS = [
  { id: 'a', rotate:  6, tx:  5, ty: -5, opacity: 0.65 },
  { id: 'b', rotate: -4, tx: -4, ty: -9, opacity: 0.4  },
] as const

type DuplicatesBadgeProps = {
  dupes: number
  primary: string
  secondary: string
}

export default function DuplicatesBadge({ dupes, primary, secondary }: DuplicatesBadgeProps) {
  const visibleLayers = Math.min(dupes, CORNER_LAYERS.length)
  const size = Math.min(24 + (dupes - 1) * 2, 30)

  return (
    <div className='absolute z-20' style={{ top: '-4px', right: '-4px' }}>
      {CORNER_LAYERS.slice(0, visibleLayers).map((layer) => (
        <div
          key={layer.id}
          className='absolute rounded-md'
          style={{
            width: '18px',
            height: '26px',
            background: `linear-gradient(135deg, ${primary}cc, ${secondary}99)`,
            transform: `rotate(${layer.rotate}deg) translate(${layer.tx}px, ${layer.ty}px)`,
            opacity: layer.opacity,
            boxShadow: '0 1px 4px #0006',
            top: 0,
            right: 0,
          }}
        />
      ))}

      <div
        className='relative rounded-full flex items-center justify-center font-black leading-none shadow-lg'
        style={{
          background: primary,
          color: '#fff',
          border: `2px solid ${secondary}`,
          boxShadow: `0 2px 8px ${primary}80`,
          width:  `${size}px`,
          height: `${size}px`,
          fontSize: dupes >= 10 ? '9px' : '11px',
        }}
      >
        {dupes > 9 ? '9+' : `+${dupes}`}
      </div>
    </div>
  )
}
