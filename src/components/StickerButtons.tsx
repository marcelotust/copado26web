import type { MouseEvent } from 'react'

type StickerButtonsProps = {
  qty: number
  collected: boolean
  onAdd: (e: MouseEvent) => void
  onRemove: (e: MouseEvent) => void
}

export default function StickerButtons({ qty, collected, onAdd, onRemove }: StickerButtonsProps) {
  // qty === 0: only show "+" taking full width
  if (qty === 0) {
    return (
      <div className='flex shrink-0 border-t border-slate-700'>
        <button
          onClick={onAdd}
          aria-label='Add sticker'
          className='flex-1 flex items-center justify-center h-7 text-base font-bold leading-none transition-colors text-emerald-600 hover:bg-emerald-900/40 hover:text-emerald-400 active:bg-emerald-900/60'
        >
          +
        </button>
      </div>
    );
  }

  return (
    <div
      className={[
        "flex items-center shrink-0 border-t",
        collected ? "border-sky-200" : "border-slate-700",
      ].join(" ")}
    >
      {/* "−" button — warning color when qty=1 since removing last copy */}
      <button
        onClick={onRemove}
        aria-label='Remove sticker'
        className={[
          "flex-1 flex items-center justify-center h-7 text-base font-bold leading-none transition-colors",
          qty === 1
            ? collected ? "text-amber-500 hover:bg-amber-100 hover:text-amber-600 active:bg-amber-200" : "text-amber-500/70 hover:bg-amber-900/40 hover:text-amber-400 active:bg-amber-900/60"
            : collected ? "text-rose-500 hover:bg-rose-100 hover:text-rose-600 active:bg-rose-200" : "text-rose-500/70 hover:bg-rose-900/40 hover:text-rose-400 active:bg-rose-900/60",
        ].join(" ")}
      >
        −
      </button>
      <div className={["w-px self-stretch", collected ? "bg-sky-200" : "bg-slate-700"].join(" ")} />
      <button
        onClick={onAdd}
        aria-label='Add sticker'
        className={`flex-1 flex items-center justify-center h-7 text-base font-bold leading-none transition-colors ${collected ? "text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 active:bg-emerald-200" : "text-emerald-500/70 hover:bg-emerald-900/40 hover:text-emerald-400 active:bg-emerald-900/60"}`}
      >
        +
      </button>
    </div>
  );
}
