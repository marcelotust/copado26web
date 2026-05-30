type Props = {
  pct: number
  color: string
  track?: string
  label?: string
  height?: string
}

export default function FatProgressBar({
  pct,
  color,
  track = 'bg-slate-700/60',
  label,
  height = 'h-7',
}: Props) {
  const clamped = Math.max(0, Math.min(100, pct))
  const pctLabel = `${clamped}%`
  const textLayout = label ? 'justify-between' : 'justify-center'

  const labelClass = 'text-xs font-bold uppercase tracking-wide truncate min-w-0 select-none leading-none'
  const valueClass = 'text-xs font-bold uppercase tabular-nums shrink-0 select-none leading-none'

  return (
    <div className={`relative ${height} rounded-full overflow-hidden ${track}`}>
      {/* Fill with top shine */}
      <div
        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${clamped}%` }}
      >
        <div className='absolute inset-0 rounded-full bg-gradient-to-b from-white/30 to-transparent' />
      </div>

      {/* Text on fill — black (colored fills are bright, black reads better) */}
      <div
        className={`absolute inset-0 flex items-center ${textLayout} px-3 gap-2 overflow-hidden pointer-events-none`}
        style={{ clipPath: `inset(0 ${100 - clamped}% 0 0)` }}
      >
        {label && <span className={`${labelClass} text-black/90`}>{label}</span>}
        <span className={`${valueClass} text-black/90`}>{pctLabel}</span>
      </div>

      {/* Text on track — white (dark track needs high-contrast text) */}
      <div
        className={`absolute inset-0 flex items-center ${textLayout} px-3 gap-2 overflow-hidden pointer-events-none`}
        style={{ clipPath: `inset(0 0 0 ${clamped}%)` }}
      >
        {label && <span className={`${labelClass} text-white`}>{label}</span>}
        <span className={`${valueClass} text-white`}>{pctLabel}</span>
      </div>
    </div>
  )
}
