import type { MouseEvent } from 'react'

type StickerButtonsProps = {
  qty: number
  collected: boolean
  softFill?: boolean
  onAdd: (e: MouseEvent) => void
  onRemove: (e: MouseEvent) => void
}

const btnBase =
  'flex-1 flex items-center justify-center h-7 text-base font-bold leading-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white/80'

export default function StickerButtons({ qty, collected, softFill = false, onAdd, onRemove }: StickerButtonsProps) {
  const barCls = collected
    ? ['border-t border-slate-600/80', softFill ? 'bg-slate-900/70' : 'bg-slate-900/90'].join(' ')
    : 'border-t border-slate-700 bg-slate-900/60'
  const dividerCls = collected ? 'bg-slate-600' : 'bg-slate-700'

  // qty === 0: only show "+" taking full width
  if (qty === 0) {
    return (
      <div className={['flex shrink-0', barCls].join(' ')}>
        <button
          onClick={onAdd}
          aria-label='Add sticker'
          className={[btnBase, 'text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 active:bg-emerald-500/30'].join(' ')}
        >
          +
        </button>
      </div>
    )
  }

  const removeCls =
    qty === 1
      ? collected
        ? 'text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 active:bg-amber-500/30'
        : 'text-amber-500/70 hover:bg-amber-900/40 hover:text-amber-400 active:bg-amber-900/60'
      : collected
        ? 'text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 active:bg-rose-500/30'
        : 'text-rose-500/70 hover:bg-rose-900/40 hover:text-rose-400 active:bg-rose-900/60'

  const addCls = collected
    ? 'text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 active:bg-emerald-500/30'
    : 'text-emerald-500/70 hover:bg-emerald-900/40 hover:text-emerald-400 active:bg-emerald-900/60'

  return (
    <div className={['flex items-center shrink-0', barCls].join(' ')}>
      <button onClick={onRemove} aria-label='Remove sticker' className={[btnBase, removeCls].join(' ')}>
        −
      </button>
      <div className={['w-px self-stretch', dividerCls].join(' ')} />
      <button onClick={onAdd} aria-label='Add sticker' className={[btnBase, addCls].join(' ')}>
        +
      </button>
    </div>
  )
}
