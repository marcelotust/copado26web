import { useState } from "react";
import { useOCR } from "../hooks/useOCR";
import { useScannerLog } from "../hooks/useScannerLog";
import ScannerTopBar from "./ScannerTopBar";
import ScannerCamera from "./ScannerCamera";
import ScannerPanel from "./ScannerPanel";

export default function OcrScanner({ onClose }) {
  const [autoScan, setAutoScan] = useState(true);
  const { log, manualCode, setManualCode, addEntry, handleManualSubmit } =
    useScannerLog();
  const { ready, scanning, rawText, scan } = useOCR(addEntry);

  return (
    <div className='fixed inset-0 bg-slate-950/97 backdrop-blur z-50 flex flex-col'>
      <ScannerTopBar
        ready={ready}
        scanning={scanning}
        autoScan={autoScan}
        onToggleAuto={() => setAutoScan((a) => !a)}
        onClose={onClose}
      />
      <div className='flex-1 flex flex-col lg:flex-row gap-4 p-4 min-h-0 overflow-y-auto'>
        <ScannerCamera
          ready={ready}
          scanning={scanning}
          rawText={rawText}
          autoScan={autoScan}
          onCapture={scan}
        />
        <ScannerPanel
          log={log}
          manualCode={manualCode}
          setManualCode={setManualCode}
          onManualSubmit={handleManualSubmit}
        />
      </div>
    </div>
  );
}
