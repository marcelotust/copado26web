import { useStickerActions } from "../hooks/useStickerActions";
import { gradientClasses, ringClass } from "../utils";
import { useI18n } from "../i18n";
import StickerButtons from "./StickerButtons";

const LABEL_KEYS = {
  Shield: "sticker.shield",
  "Team Photo": "sticker.teamPhoto",
};

export default function SwapCard({ sticker }) {
  const { t } = useI18n();
  const { handleAdd, handleRemove } = useStickerActions(sticker.id);
  const qty = sticker.quantity;
  const collected = qty > 0;
  const dupes = qty - 1;
  const numLabel = String(sticker.number).padStart(2, "0");

  return (
    <div
      className={[
        "relative select-none rounded-xl flex flex-col",
        "transition-all duration-150",
        collected
          ? `bg-gradient-to-br ${gradientClasses(sticker.teamCode)} shadow-lg ${ringClass(sticker.teamCode)} ring-2`
          : "bg-slate-800 ring-1 ring-slate-700",
      ].join(" ")}
    >
      <div className='flex flex-col items-center justify-center py-2 px-1 gap-0.5 flex-1'>
        <span
          className={[
            "font-black leading-none tabular-nums",
            collected
              ? "text-white text-2xl drop-shadow"
              : "text-slate-500 text-xl",
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
          {sticker.teamCode}
        </span>
        {sticker.label && (
          <span
            className={[
              "text-[14px] font-medium leading-tight text-center px-0.5 truncate w-full",
              collected ? "text-white/80" : "text-slate-500",
            ].join(" ")}
            title={sticker.label}
          >
            {sticker.label in LABEL_KEYS
              ? t(
                  LABEL_KEYS[
                    /** @type {keyof typeof LABEL_KEYS} */ (sticker.label)
                  ],
                )
              : sticker.label}
          </span>
        )}
      </div>

      <StickerButtons
        qty={qty}
        collected={collected}
        onAdd={handleAdd}
        onRemove={handleRemove}
      />

      {dupes > 0 && (
        <span className='absolute -top-1 -right-1 bg-red-500 text-white text-[18px] font-black rounded-full min-w-[30px] h-[30px] flex items-center justify-center px-1 shadow-md leading-none'>
          +{dupes}
        </span>
      )}
    </div>
  );
}
