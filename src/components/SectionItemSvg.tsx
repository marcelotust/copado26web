const RADIUS = 11
const CIRC = 2 * Math.PI * RADIUS

type SectionItemSvgProps = {
  dash: number
  done: boolean
  pct: number
}

export default function SectionItemSvg({ dash, done, pct }: SectionItemSvgProps) {
  return (
    <svg
      width='28'
      height='28'
      viewBox='0 0 28 28'
      className='shrink-0'
      style={{ transform: 'rotate(-90deg)' }}
    >
      <circle cx='14' cy='14' r={RADIUS} fill='none' stroke='#1e293b' strokeWidth='3' />
      <circle
        cx='14'
        cy='14'
        r={RADIUS}
        fill='none'
        strokeWidth='3'
        strokeDasharray={`${dash} ${CIRC}`}
        strokeLinecap='round'
        style={{
          stroke: done ? '#34d399' : pct > 0 ? '#94a3b8' : '#1e293b',
          transition: 'stroke-dasharray 0.4s ease',
        }}
      />
      {done && (
        <g style={{ transform: 'rotate(90deg)', transformOrigin: '14px 14px' }}>
          <text x='14' y='18' textAnchor='middle' fontSize='10' fill='#34d399' fontWeight='bold'>✓</text>
        </g>
      )}
    </svg>
  )
}
