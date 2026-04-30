import { useProgress } from "../hooks/useStickers";
import { useI18n } from "../i18n";
import ProgressBar from "./ProgressBar";

export default function Header({ onScanClick, onSwapsClick, view }) {
  const { total, collected, swaps } = useProgress();
  const { t } = useI18n();

  return (
    <header className='shrink-0 flex items-center gap-3 px-4 py-2.5 bg-slate-900/95 backdrop-blur border-b border-slate-800 z-10'>
      <div className='flex items-center gap-2 px-2 lg:px-3 py-3 shrink-0'>
        <span className='text-xl shrink-0'>⚽</span>
        <div className='lg:block min-w-0'>
          <p className='text-white font-black text-x leading-none tracking-tight'>
            COPADO26
          </p>
          <p className='text-slate-600 text-[9px] leading-none mt-0.5'>
            {t("appSubtitle")}
          </p>
        </div>
      </div>

      <ProgressBar collected={collected} total={total} />

      <div className='flex items-center gap-1.5 shrink-0'>
        <button
          onClick={onSwapsClick}
          className={[
            "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
            view === "swaps"
              ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700",
          ].join(" ")}
        >
          🔄
          <span className='hidden sm:inline'>{t("header.swaps")}</span>
          {swaps > 0 && (
            <span className='bg-amber-500 text-white text-[9px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-1'>
              {swaps}
            </span>
          )}
        </button>

        <button
          onClick={onScanClick}
          className={[
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
            view === "scanner"
              ? "bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/30"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700",
          ].join(" ")}
        >
          📷
          <span className='hidden sm:inline'>{t("header.scan")}</span>
        </button>
      </div>
    </header>
  );
}
