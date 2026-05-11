import { useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

function parseCodeToStickerId(rawCode) {
  const normalized = rawCode.trim().toUpperCase();
  const [team, numStr] = normalized.split(/[\s-]/);
  if (!team || !numStr) return null;
  return `${team}-${String(parseInt(numStr, 10)).padStart(2, '0')}`;
}

export function useScannerLog(userId) {
  const [log, setLog] = useState([]);
  const [manualCode, setManualCode] = useState("");

  const addEntry = useCallback(async (code) => {
    const stickerId = parseCodeToStickerId(code);

    if (stickerId && userId) {
      const { data: row, error: fetchError } = await supabase
        .from('stickers')
        .select('quantity')
        .eq('id', stickerId)
        .eq('user_id', userId)
        .single()

      if (fetchError) {
        console.error('Failed to fetch sticker for increment:', fetchError)
      } else if (row) {
        const { error } = await supabase
          .from('stickers')
          .update({ quantity: row.quantity + 1 })
          .eq('id', stickerId)
          .eq('user_id', userId)

        if (error) console.error('Failed to increment sticker:', error)
      }
    }

    setLog((prev) => [
      { code, id: stickerId || null, ts: Date.now() },
      ...prev.slice(0, 14),
    ]);
    return stickerId;
  }, [userId]);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    await addEntry(manualCode.trim());
    setManualCode("");
  };

  return { log, manualCode, setManualCode, addEntry, handleManualSubmit };
}
