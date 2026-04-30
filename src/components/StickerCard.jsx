import { useStickerActions } from "../hooks/useStickerActions";
import { gradientClasses, ringClass } from "../utils";
import StickerButtons from "./StickerButtons";

export default function StickerCard({ sticker, teamCode }) {
  const { popping, floats, handleAdd, handleRemove } = useStickerActions(
    sticker.id,
  );
  const qty = sticker.quantity;
  const collected = qty > 0;
  const dupes = qty - 1;
  const numLabel = String(sticker.number).padStart(2, "0");

  return (
    <div
      aria-label={`Sticker ${sticker.id}, quantity ${qty}`}
      className={[
        "relative select-none rounded-xl flex flex-col",
        "transition-all duration-150",
        collected
          ? `bg-gradient-to-br ${gradientClasses(teamCode)} shadow-lg ${ringClass(teamCode)} ring-2`
          : "bg-slate-800 ring-1 ring-slate-700",
        popping ? "animate-pop" : "",
      ].join(" ")}
    >
      <div className='flex flex-col items-center justify-center py-2 px-1 gap-0.5 flex-1'>
        <span
          className={[
            "font-black leading-none tabular-nums",
            collected ? "text-white text-2xl drop-shadow" : "text-slate-500 text-xl",
          ].join(" ")}
        >
          {numLabel}
        </span>
        <span
          className={[
            "text-[9px] font-semibold tracking-widest uppercase",
            collected ? "text-white/70" : "text-slate-600",
          ].join(" ")}
        >
          {teamCode}
        </span>
      </div>

      <StickerButtons qty={qty} collected={collected} onAdd={handleAdd} onRemove={handleRemove} />

      {dupes > 0 && (
        <span className='absolute -top-1 -right-1 bg-red-500 text-white text-[18px] font-black rounded-full min-w-[30px] h-[30px] flex items-center justify-center px-1 shadow-md leading-none'>
          +{dupes}
        </span>
      )}

      {floats.map((key) => (
        <span
          key={key}
          className='absolute inset-0 flex items-center justify-center pointer-events-none animate-floatUp text-white font-black text-sm'
        >
          +1
        </span>
      ))}
    </div>
  );
}
