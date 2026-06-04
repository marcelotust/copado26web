import { useEffect, useRef } from 'react'

export function useInactivityReload(thresholdMs: number): void {
  const lastHiddenAt = useRef<number | null>(null)

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        lastHiddenAt.current = Date.now()
      } else if (document.visibilityState === 'visible') {
        checkAndReload()
      }
    }

    function checkAndReload() {
      if (lastHiddenAt.current !== null && Date.now() - lastHiddenAt.current >= thresholdMs) {
        lastHiddenAt.current = null // guard against double-fire
        window.location.reload()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', checkAndReload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', checkAndReload)
    }
  }, [thresholdMs])
}
