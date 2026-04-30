import { SECTIONS } from "../db/seed";
import { decrement, increment } from "../hooks/useStickers";
import { gradientClasses } from "../utils";
import { useI18n } from "../i18n";

const LABEL_KEYS = {
  Shield: "sticker.shield",
  "Team Photo": "sticker.teamPhoto",
};

export default function SwapCard({ sticker }) {
  const { t } = useI18n();
  const section = SECTIONS.find((s) => s.code === sticker.teamCode);
  const name = t(`teams.${sticker.teamCode}`);
  const dupes = sticker.quantity - 1;
  const qty = sticker.quantity;
  const collected = qty > 0;

  return (
    <div
      className={`relative flex items-center justify-between bg-gradient-to-r ${gradientClasses(sticker.teamCode)} rounded-xl px-3 py-2.5 shadow`}
    >
      <div className='flex items-center gap-4 shrink-0'>
        <span className='text-2xl shrink-0'>{section?.flag ?? "🏳️"}</span>
        <div className='flex-1 min-w-0'>
          <p className='text-white font-black text-sm leading-tight'>
            {sticker.id}
          </p>
          <p className='text-white/70 text-xs truncate'>{name}</p>
        </div>
      </div>
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
      <div className='flex items-center gap-1.5 shrink-0'>
        <button
          onClick={() => decrement(sticker.id)}
          className='w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-base flex items-center justify-center transition-colors'
        >
          −
        </button>
        <span className='bg-red-500 text-white text-[16px] font-black rounded-full min-w-[30px] h-[30px] flex items-center justify-center px-1'>
          {dupes}
        </span>
        <button
          onClick={() => increment(sticker.id)}
          className='w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-base flex items-center justify-center transition-colors'
        >
          +
        </button>
      </div>
    </div>
  );
}
