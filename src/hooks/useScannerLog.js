import { useState, useCallback } from "react";
import { incrementByCode } from "./useStickers";

export function useScannerLog() {
  const [log, setLog] = useState([]);
  const [manualCode, setManualCode] = useState("");

  const addEntry = useCallback(async (code) => {
    const id = await incrementByCode(code);
    setLog((prev) => [
      { code, id: id || null, ts: Date.now() },
      ...prev.slice(0, 14),
    ]);
    return id;
  }, []);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    await addEntry(manualCode.trim());
    setManualCode("");
  };

  return { log, manualCode, setManualCode, addEntry, handleManualSubmit };
}
