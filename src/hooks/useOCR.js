import { useState, useRef, useCallback, useEffect } from 'react'
import { createWorker } from 'tesseract.js'

const STICKER_PATTERN = /\b([A-Z]{2,3})\s*(\d{1,2})\b/g

export function useOCR(onMatch) {
  const [ready, setReady]       = useState(false)
  const [scanning, setScanning] = useState(false)
  const [lastHit, setLastHit]   = useState(null)
  const workerRef  = useRef(null)
  const cooldown   = useRef(new Set())
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    let worker

    createWorker('eng').then(async w => {
      worker = w
      await w.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -',
        tessedit_pageseg_mode:   '7',
      })
      workerRef.current = w
      if (mountedRef.current) setReady(true)
    })

    return () => {
      mountedRef.current = false
      worker?.terminate()
    }
  }, [])

  const scan = useCallback(async (imageData) => {
    if (!workerRef.current || scanning) return

    setScanning(true)
    try {
      const { data: { text } } = await workerRef.current.recognize(imageData)
      const upper = text.toUpperCase()

      STICKER_PATTERN.lastIndex = 0
      let match
      while ((match = STICKER_PATTERN.exec(upper)) !== null) {
        const code = `${match[1]} ${match[2]}`
        if (!cooldown.current.has(code)) {
          cooldown.current.add(code)
          setTimeout(() => cooldown.current.delete(code), 2000)
          if (mountedRef.current) setLastHit(code)
          onMatch?.(code)
        }
      }
    } finally {
      if (mountedRef.current) setScanning(false)
    }
  }, [scanning, onMatch])

  return { ready, scanning, lastHit, scan }
}
