import { useEffect, useState } from 'react'

export type TargetRect = {
  top: number
  left: number
  width: number
  height: number
}

export function useOnboardingTargetRect(targetSelector: string | null): TargetRect | null {
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null)

  useEffect(() => {
    function updateTarget(shouldScroll: boolean) {
      if (!targetSelector) {
        setTargetRect(null)
        return
      }

      const target = document.querySelector<HTMLElement>(targetSelector)
      if (!target) {
        setTargetRect(null)
        return
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
    }

    updateTarget(true)
    const timeout = window.setTimeout(() => updateTarget(false), 260)
    const onViewportChange = () => updateTarget(false)

    window.addEventListener('resize', onViewportChange)
    window.addEventListener('scroll', onViewportChange, true)

    return () => {
      window.clearTimeout(timeout)
      window.removeEventListener('resize', onViewportChange)
      window.removeEventListener('scroll', onViewportChange, true)
    }
  }, [targetSelector])

  return targetRect
}
