// "+1" and "-1" animation overlays that fade upward when a sticker is added
// or removed. The arrays hold opaque timestamps so React can identify each
// concurrent popup without colliding keys.

type FloatPopupsProps = {
  floats: number[]
  removals: number[]
}

const BASE_STYLE = {
  top: '50%',
  left: '50%',
  fontSize: 'clamp(18px, 5vw, 24px)',
} as const

export default function FloatPopups({ floats, removals }: FloatPopupsProps) {
  return (
    <>
      {floats.map((key) => (
        <span
          key={key}
          className='absolute pointer-events-none animate-floatUp font-black z-30'
          style={{
            ...BASE_STYLE,
            color: '#4ade80',
            textShadow: '0 0 12px #16a34a, 0 2px 4px #000a',
          }}
        >
          +1
        </span>
      ))}
      {removals.map((key) => (
        <span
          key={key}
          className='absolute pointer-events-none animate-floatUp font-black z-30'
          style={{
            ...BASE_STYLE,
            color: '#f87171',
            textShadow: '0 0 12px #dc2626, 0 2px 4px #000a',
          }}
        >
          −1
        </span>
      ))}
    </>
  )
}
