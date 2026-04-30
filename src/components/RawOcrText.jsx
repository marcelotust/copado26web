import { useState } from "react";
import { useI18n } from "../i18n";

export default function RawOcrText({ rawText }) {
  const { t } = useI18n();
  const [showRaw, setShowRaw] = useState(false);

  if (!rawText) return null;

  return (
    <div className='w-full max-w-lg'>
      <button
        onClick={() => setShowRaw((r) => !r)}
        className='text-[10px] text-slate-600 hover:text-slate-400 transition-colors'
      >
        {showRaw ? t("scanner.hideRaw") : t("scanner.showRaw")}
      </button>
      {showRaw && (
        <pre className='mt-1 bg-slate-900 rounded-lg p-2 text-[10px] text-slate-400 font-mono whitespace-pre-wrap break-all max-h-24 overflow-y-auto'>
          {rawText}
        </pre>
      )}
    </div>
  );
}
