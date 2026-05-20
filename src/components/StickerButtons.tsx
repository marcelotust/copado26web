import type { MouseEvent } from 'react'

type StickerButtonsProps = {
  qty: number
  onAdd: (e: MouseEvent) => void
  onRemove: (e: MouseEvent) => void
}

const btnBase =
  'flex-1 flex items-center justify-center h-7 text-base font-bold leading-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white/80'

export default function StickerButtons({ qty, onAdd, onRemove }: StickerButtonsProps) {
  const dividerCls = 'bg-slate-600'

  if (qty === 0) {
    return (
      <div className='flex shrink-0 bg-slate-800 rounded-b-xl'>
        <button
          onClick={onAdd}
          aria-label='Add sticker'
          className={[btnBase, 'rounded-b-xl text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 active:bg-emerald-500/30'].join(' ')}
        >
          +
        </button>
      </div>
    )
  }

  const removeCls =
    qty === 1
      ? 'text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 active:bg-amber-500/30'
      : 'text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 active:bg-rose-500/30'

  const addCls = 'text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 active:bg-emerald-500/30'

  return (
    <div className='flex items-center shrink-0 bg-slate-800 rounded-b-xl'>
      <button onClick={onRemove} aria-label='Remove sticker' className={[btnBase, 'rounded-bl-xl', removeCls].join(' ')}>
        −
      </button>
      <div className={['w-px self-stretch', dividerCls].join(' ')} />
      <button onClick={onAdd} aria-label='Add sticker' className={[btnBase, 'rounded-br-xl', addCls].join(' ')}>
        +
      </button>
    </div>
  )
}
