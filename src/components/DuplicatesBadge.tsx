import { useMemo } from 'react'

// Stacked mini-cards badge at top-right of collected stickers with duplicates.
// Shows up to 4 back cards behind the top card; beyond that the stack stays at max depth.

const W = 30
const H = 42

// Back-layer definitions ordered from furthest to closest (rendered first = behind)
const BACK_LAYERS = [
  { rotate: -14, tx: -4, ty: -12 },
  { rotate:  -8, tx: -2, ty:  -7 },
  { rotate:  10, tx:  9, ty:   9 },
  { rotate:   5, tx:  4, ty:   4 },
] as const

const CARD_BASE: React.CSSProperties = {
  position: 'absolute',
  width: W,
  height: H,
  border: '1.5px solid #ffffff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.35)',
}

type DuplicatesBadgeProps = {
  dupes: number
  primary: string
  secondary: string
}

export default function DuplicatesBadge({ dupes, primary }: DuplicatesBadgeProps) {
  const topRotate = useMemo(() => (Math.random() - 0.5) * 10, [])
  const visibleBack = Math.min(dupes - 1, BACK_LAYERS.length)
  // Slice from the end so layer count grows naturally with dupes
  const layers = BACK_LAYERS.slice(BACK_LAYERS.length - visibleBack)

  return (
    <div
      className='absolute z-20'
      style={{ top: 6, right: 6, width: W, height: H }}
    >
      {layers.map((layer, i) => (
        <div
          key={i}
          style={{
            ...CARD_BASE,
            background: '#48baf4',
            transform: `rotate(${layer.rotate}deg) translate(${layer.tx}px, ${layer.ty}px)`,
          }}
        />
      ))}

      {/* Top card — shows the count */}
      <div
        style={{
          ...CARD_BASE,
          position: 'relative',
          background: '#48baf4',
          transform: `rotate(${topRotate}deg)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
        }}
      >
        <span
          style={{
            color: '#fff',
            fontSize: dupes >= 10 ? '13px' : '16px',
            fontWeight: 900,
            lineHeight: 1,
            textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            fontFamily: "'Bebas Neue', Impact, sans-serif",
          }}
        >
          {dupes > 9 ? '9+' : `+${dupes}`}
        </span>
      </div>
    </div>
  )
}
