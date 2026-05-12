import { useState, useCallback } from 'react'
import { useAdjustSticker } from '../state/stickersStore'

/** @param {string} rawCode */
function parseCodeToStickerId(rawCode) {
  const m = rawCode.trim().toUpperCase().match(/^([A-Z]{2,3})[\s-]?(\d{1,2})$/)
  if (!m) return null
  let team = m[1]
  const num = parseInt(m[2], 10)
  if (!Number.isFinite(num) || num < 0 || num > 30) return null
  // The album prints opening stickers as "FWC 01"–"FWC 08" but the catalog
  // stores them under the WAP section so they don't collide with the history
  // section's "FWC 09"–"FWC 19".
  if (team === 'FWC' && num >= 1 && num <= 8) team = 'WAP'
  return `${team}-${String(num).padStart(2, '0')}`
}

export function useScannerLog() {
  const adjust = useAdjustSticker()
  const [log, setLog] = useState(/** @type {{ code: string, id: string|null, ts: number }[]} */ ([]))
  const [manualCode, setManualCode] = useState('')

  const addEntry = useCallback(async (/** @type {string} */ code) => {
    const stickerId = parseCodeToStickerId(code)

    setLog(prev => [
      { code, id: stickerId, ts: Date.now() },
      ...prev.slice(0, 14),
    ])

    if (stickerId) {
      try {
        await adjust(stickerId, 1)
      } catch (err) {
        console.error('Scanner failed to increment sticker:', err)
      }
    }

    return stickerId
  }, [adjust])

  const handleManualSubmit = useCallback(async (/** @type {React.FormEvent} */ e) => {
    e.preventDefault()
    const trimmed = manualCode.trim()
    if (!trimmed) return
    await addEntry(trimmed)
    setManualCode('')
  }, [manualCode, addEntry])

  return { log, manualCode, setManualCode, addEntry, handleManualSubmit }
}
