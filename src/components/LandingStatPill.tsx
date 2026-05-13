type Props = { value: string; label: string }

export default function LandingStatPill({ value, label }: Props) {
  return (
    <div className='flex flex-col items-center gap-0.5'>
      <span className='text-xl sm:text-2xl font-black text-white tabular-nums'>{value}</span>
      <span className='text-[10px] sm:text-xs text-slate-500'>{label}</span>
    </div>
  )
}
