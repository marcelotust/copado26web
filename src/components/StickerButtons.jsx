/** @param {{ qty: number, collected: boolean, onAdd: (e: React.MouseEvent) => void, onRemove: (e: React.MouseEvent) => void }} props */
export default function StickerButtons({ qty, collected, onAdd, onRemove }) {
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
        "flex shrink-0 border-t",
        collected ? "border-white/20" : "border-slate-700",
      ].join(" ")}
    >
      {/* "−" button — warning color when qty=1 since removing last copy */}
      <button
        onClick={onRemove}
        aria-label='Remove sticker'
        className={[
          "flex-1 flex items-center justify-center h-7 text-base font-bold leading-none transition-colors",
          qty === 1
            ? "text-amber-500/70 hover:bg-amber-900/40 hover:text-amber-400 active:bg-amber-900/60"
            : "text-rose-500/70 hover:bg-rose-900/40 hover:text-rose-400 active:bg-rose-900/60",
        ].join(" ")}
      >
        −
      </button>
      <div
        className={["w-px", collected ? "bg-white/20" : "bg-slate-700"].join(" ")}
      />
      <button
        onClick={onAdd}
        aria-label='Add sticker'
        className='flex-1 flex items-center justify-center h-7 text-base font-bold leading-none transition-colors text-emerald-500/70 hover:bg-emerald-900/40 hover:text-emerald-400 active:bg-emerald-900/60'
      >
        +
      </button>
    </div>
  );
}
