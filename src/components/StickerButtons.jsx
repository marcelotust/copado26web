export default function StickerButtons({ qty, collected, onAdd, onRemove }) {
  return (
    <div
      className={[
        "flex shrink-0 border-t",
        collected ? "border-white/20" : "border-slate-700",
      ].join(" ")}
    >
      <button
        onClick={onRemove}
        disabled={qty === 0}
        aria-label='Remove sticker'
        className={[
          "flex-1 flex items-center justify-center h-7 text-base font-bold leading-none transition-colors",
          qty === 0
            ? "text-slate-700 cursor-not-allowed"
            : collected
              ? "text-white/60 hover:bg-white/20 hover:text-white active:bg-white/30"
              : "text-slate-500 hover:bg-slate-700 hover:text-slate-300 active:bg-slate-600",
        ].join(" ")}
      >
        −
      </button>
      <div
        className={["w-px", collected ? "bg-white/20" : "bg-slate-700"].join(
          " ",
        )}
      />
      <button
        onClick={onAdd}
        aria-label='Add sticker'
        className={[
          "flex-1 flex items-center justify-center h-7 text-base font-bold leading-none transition-colors",
          collected
            ? "text-white/60 hover:bg-white/20 hover:text-white active:bg-white/30"
            : "text-slate-500 hover:bg-slate-700 hover:text-slate-300 active:bg-slate-600",
        ].join(" ")}
      >
        +
      </button>
    </div>
  );
}
