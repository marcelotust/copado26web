import { useEffect, useState } from 'react'

export type TargetRect = {
  top: number
  left: number
  width: number
  height: number
}

const RETRY_MS = 120
const MAX_RETRIES = 28

export function useOnboardingTargetRect(targetSelector: string | null): TargetRect | null {
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null)

  useEffect(() => {
    setTargetRect(null)

    let cancelled = false
    let retryTimer: number | undefined
    let scrollTimer: number | undefined
    let attempt = 0

    function measureTarget(shouldScroll: boolean): HTMLElement | null {
      if (!targetSelector) return null
      return document.querySelector<HTMLElement>(targetSelector)
    }

    function updateTarget(shouldScroll: boolean) {
      if (!targetSelector) {
        setTargetRect(null)
        return null
      }

      const target = measureTarget(shouldScroll)
      if (!target) {
        setTargetRect(null)
        return null
      }

      if (shouldScroll) {
        target.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' })
      }

      const rect = target.getBoundingClientRect()
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      })
      return target
    }

    function scheduleRetry() {
      if (cancelled || !targetSelector || attempt >= MAX_RETRIES) return
      retryTimer = window.setTimeout(() => {
        attempt += 1
        const found = updateTarget(attempt === 0)
        if (!found) scheduleRetry()
      }, RETRY_MS)
    }

    attempt = 0
    const found = updateTarget(true)
    scrollTimer = window.setTimeout(() => updateTarget(false), 280)
    if (!found) scheduleRetry()

    const onViewportChange = () => updateTarget(false)
    window.addEventListener('resize', onViewportChange)
    window.addEventListener('scroll', onViewportChange, true)

    return () => {
      cancelled = true
      if (retryTimer !== undefined) window.clearTimeout(retryTimer)
      if (scrollTimer !== undefined) window.clearTimeout(scrollTimer)
      window.removeEventListener('resize', onViewportChange)
      window.removeEventListener('scroll', onViewportChange, true)
    }
  }, [targetSelector])

  return targetRect
}
