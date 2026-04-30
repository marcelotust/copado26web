import { useState, useRef, useCallback, useEffect } from 'react'
import { createWorker } from 'tesseract.js'

// More flexible: allows BRA10, BRA 10, BRA-10
const STICKER_PATTERN = /([A-Z]{2,3})[-\s]?(\d{1,2})/g

export function useOCR(onMatch) {
  const [ready, setReady]       = useState(false)
  const [scanning, setScanning] = useState(false)
  const [rawText, setRawText]   = useState('')
  const [lastHit, setLastHit]   = useState(null)

  const workerRef   = useRef(null)
  const scanningRef = useRef(false)   // ref-guard avoids stale closure in scan callback
  const cooldown    = useRef(new Set())
  const mountedRef  = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    let worker

    createWorker('eng').then(async w => {
      worker = w
      // PSM 11 = sparse text, finds text anywhere without assuming layout
      // No character whitelist — whitelists cause misreads when a char is borderline
      await w.setParameters({ tessedit_pageseg_mode: '11' })
      workerRef.current = w
      if (mountedRef.current) setReady(true)
    })

    return () => {
      mountedRef.current = false
      worker?.terminate()
    }
  }, [])

  const scan = useCallback(async (imageData) => {
    if (!workerRef.current || scanningRef.current) return

    scanningRef.current = true
    if (mountedRef.current) setScanning(true)

    try {
      const { data: { text } } = await workerRef.current.recognize(imageData)
      const upper = text.toUpperCase().replace(/[^A-Z0-9\s\-\n]/g, ' ')

      if (mountedRef.current) setRawText(upper.trim())

      STICKER_PATTERN.lastIndex = 0
      let match
      while ((match = STICKER_PATTERN.exec(upper)) !== null) {
        const teamCode = match[1]
        const num      = match[2]
        // Reject obvious false-positives (number out of range, etc.)
        if (parseInt(num, 10) < 1 || parseInt(num, 10) > 30) continue

        const code = `${teamCode} ${num}`
        if (!cooldown.current.has(code)) {
          cooldown.current.add(code)
          setTimeout(() => cooldown.current.delete(code), 2000)
          if (mountedRef.current) setLastHit(code)
          onMatch?.(code)
        }
      }
    } catch (err) {
      console.warn('[OCR]', err)
    } finally {
      scanningRef.current = false
      if (mountedRef.current) setScanning(false)
    }
  // onMatch intentionally omitted — caller should useCallback/stable ref
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { ready, scanning, rawText, lastHit, scan }
}
