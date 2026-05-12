import { useEffect, useRef } from 'react'

// Accumulates an integer delta and fires `flush(delta)` after `wait` ms of
// quiet. Resets the timer on every bump. Flushes any remainder on unmount.

export function useDebouncedFlush(flush: (delta: number) => void, wait = 400) {
  const deltaRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function fire() {
    const d = deltaRef.current
    deltaRef.current = 0
    timerRef.current = null
    if (d !== 0) flush(d)
  }

  function bump(by: number) {
    deltaRef.current += by
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(fire, wait)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      if (deltaRef.current !== 0) flush(deltaRef.current)
      deltaRef.current = 0
    }
  // flush is stable in the caller; we don't want to reset the timer on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { bump }
}
