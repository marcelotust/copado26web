import type { FormEvent } from "react";
import { useI18n } from "../i18n";
import ScanLogEntry from "./ScanLogEntry";
import type { ScanLogEntry as ScanLogEntryType } from "../hooks/useScannerLog";

type ScannerPanelProps = {
  log: ScanLogEntryType[]
  manualCode: string
  setManualCode: (code: string) => void
  onManualSubmit: (e: FormEvent) => void
}

export default function ScannerPanel({ log, manualCode, setManualCode, onManualSubmit }: ScannerPanelProps) {
  const { t } = useI18n();

  return (
    <div className='flex flex-col gap-3 lg:w-72 shrink-0'>
      <div className='bg-slate-900 rounded-xl p-3 border border-slate-800'>
        <p className='text-xs text-slate-400 font-semibold mb-2'>
          {t("scanner.typeLabel")}
        </p>
        <form onSubmit={onManualSubmit} className='flex gap-2'>
          <input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
            placeholder={t("scanner.placeholder")}
            maxLength={8}
            className='flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono'
          />
          <button
            type='submit'
            className='px-3 py-2 bg-sky-600 hover:bg-sky-500 rounded-lg text-white text-sm font-bold transition-colors'
          >
            {t("scanner.add")}
          </button>
        </form>
      </div>

      <div className='bg-slate-900 rounded-xl border border-slate-800 flex-1 flex flex-col min-h-0'>
        <p className='text-xs text-slate-500 font-semibold px-3 pt-3 pb-2 border-b border-slate-800'>
          {t("scanner.logTitle")}
        </p>
        <div className='overflow-y-auto flex-1 p-2 space-y-1.5'>
          {log.length === 0 ? (
            <p className='text-center text-slate-700 text-xs py-4'>
              {t("scanner.empty")}
            </p>
          ) : (
            log.map((entry) => <ScanLogEntry key={entry.ts} entry={entry} />)
          )}
        </div>
      </div>
    </div>
  );
}
