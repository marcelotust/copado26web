import { useRef, useEffect, useCallback, useState } from "react";
import Webcam from "react-webcam";
import { useI18n } from "../i18n";
import CameraErrorView from "./CameraErrorView";
import RawOcrText from "./RawOcrText";

const VIDEO_CONSTRAINTS = {
  facingMode: { ideal: "environment" },
  width: { ideal: 1920 },
  height: { ideal: 1080 },
};

const CORNER_CLASSES = [
  "top-3 left-3 border-t-2 border-l-2 rounded-tl",
  "top-3 right-3 border-t-2 border-r-2 rounded-tr",
  "bottom-3 left-3 border-b-2 border-l-2 rounded-bl",
  "bottom-3 right-3 border-b-2 border-r-2 rounded-br",
];

export default function ScannerCamera({ ready, scanning, rawText, autoScan, onCapture }) {
  const { t } = useI18n();
  const webcamRef = useRef(null);
  const [camError, setCamError] = useState(null);

  const capture = useCallback(() => {
    if (!webcamRef.current) return;
    const img = webcamRef.current.getScreenshot();
    if (img) onCapture(img);
  }, [onCapture]);

  useEffect(() => {
    if (!ready || !autoScan) return;
    const id = setInterval(capture, 1500);
    return () => clearInterval(id);
  }, [ready, autoScan, capture]);

  return (
    <div className='flex flex-col items-center gap-3 lg:flex-1'>
      {camError ? (
        <CameraErrorView error={camError} />
      ) : (
        <div className='relative w-full max-w-lg rounded-2xl overflow-hidden bg-slate-900 shadow-2xl'>
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat='image/jpeg'
            screenshotQuality={0.92}
            videoConstraints={VIDEO_CONSTRAINTS}
            onUserMediaError={(e) => setCamError(e.message ?? String(e))}
            className='w-full block'
          />
          <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
            <div
              className={[
                "w-4/5 h-20 border-2 rounded-xl transition-all duration-300",
                scanning
                  ? "border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.5)]"
                  : "border-white/25",
              ].join(" ")}
            />
          </div>
          <div className='absolute inset-0 pointer-events-none'>
            {CORNER_CLASSES.map((cls) => (
              <div key={cls} className={`absolute w-6 h-6 border-sky-400 ${cls}`} />
            ))}
          </div>
        </div>
      )}
      <button
        onClick={capture}
        disabled={!ready || scanning || !!camError}
        className='w-full max-w-lg py-3 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold text-sm transition-colors active:scale-95'
      >
        {scanning ? t("scanner.scanning") : t("scanner.capture")}
      </button>
      <p className='text-slate-600 text-xs text-center'>
        {t("scanner.alignHint")} <span className='text-slate-400 font-mono'>BRA 10</span>
      </p>
      <RawOcrText rawText={rawText} />
    </div>
  );
}
