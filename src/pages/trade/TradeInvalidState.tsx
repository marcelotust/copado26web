type TradeInvalidStateProps = { title: string; body: string }

export default function TradeInvalidState({ title, body }: TradeInvalidStateProps) {
  return (
    <div className='flex flex-col items-center text-center gap-3 pt-8'>
      <span className='text-5xl'>🔗</span>
      <p className='text-white font-semibold'>{title}</p>
      <p className='text-slate-400 text-sm max-w-xs leading-relaxed'>{body}</p>
    </div>
  )
}
