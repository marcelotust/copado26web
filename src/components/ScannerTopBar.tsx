import { useI18n } from "../i18n";

type ScannerTopBarProps = {
  ready: boolean
  scanning: boolean
  autoScan: boolean
  onToggleAuto: () => void
  onClose: () => void
}

export default function ScannerTopBar({ ready, scanning, autoScan, onToggleAuto, onClose }: ScannerTopBarProps) {
  const { t } = useI18n();

  return (
    <div className='flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0'>
      <div className='flex items-center gap-2 flex-wrap'>
        <span className='text-white font-bold'>📷 {t("scanner.title")}</span>
        <span
          className={[
            "text-[10px] font-semibold px-2 py-0.5 rounded-full",
            !ready
              ? "bg-slate-700 text-slate-400 animate-pulse"
              : scanning
                ? "bg-sky-500/20 text-sky-300"
                : "bg-emerald-500/20 text-emerald-300",
          ].join(" ")}
        >
          {!ready
            ? t("scanner.ocrLoading")
            : scanning
              ? t("scanner.scanning")
              : t("scanner.ready")}
        </span>
        <button
          onClick={onToggleAuto}
          className={[
            "text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors",
            autoScan
              ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
              : "bg-slate-700/50 text-slate-500 border-slate-700",
          ].join(" ")}
        >
          {autoScan ? "⏸ Auto" : "▶ Auto"}
        </button>
      </div>
      <button
        onClick={onClose}
        className='text-slate-400 hover:text-white p-1'
        aria-label='Close'
      >
        <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
        </svg>
      </button>
    </div>
  );
}
