import { useCallback, useEffect, useRef, useState } from 'react'

export const ONBOARDING_FADE_MS = 220
/** Fallback if target never mounts (lazy route, missing selector). */
const TARGET_STUCK_MS = 2400

type TargetRect = { top: number; left: number; width: number; height: number } | null

export function useOnboardingStepFade(initialIndex = 0) {
  const [stepIndex, setStepIndex] = useState(initialIndex)
  const [visible, setVisible] = useState(true)
  const awaitingRevealRef = useRef(false)
  const fadeTimerRef = useRef<number | undefined>(undefined)
  const revealTimerRef = useRef<number | undefined>(undefined)
  const stuckTimerRef = useRef<number | undefined>(undefined)

  const clearTimers = useCallback(() => {
    if (fadeTimerRef.current !== undefined) {
      window.clearTimeout(fadeTimerRef.current)
      fadeTimerRef.current = undefined
    }
    if (revealTimerRef.current !== undefined) {
      window.clearTimeout(revealTimerRef.current)
      revealTimerRef.current = undefined
    }
    if (stuckTimerRef.current !== undefined) {
      window.clearTimeout(stuckTimerRef.current)
      stuckTimerRef.current = undefined
    }
  }, [])

  const goToStep = useCallback((next: number) => {
    if (next === stepIndex) return
    clearTimers()
    awaitingRevealRef.current = true
    setVisible(false)
    fadeTimerRef.current = window.setTimeout(() => {
      setStepIndex(next)
    }, ONBOARDING_FADE_MS)
  }, [clearTimers, stepIndex])

  const tryReveal = useCallback((targetRect: TargetRect, needsTarget: boolean) => {
    if (!awaitingRevealRef.current) return

    const show = () => {
      if (!awaitingRevealRef.current) return
      clearTimers()
      awaitingRevealRef.current = false
      revealTimerRef.current = window.setTimeout(() => setVisible(true), 32)
    }

    if (needsTarget && !targetRect) {
      if (stuckTimerRef.current === undefined) {
        stuckTimerRef.current = window.setTimeout(show, TARGET_STUCK_MS)
      }
      return
    }

    show()
  }, [clearTimers])

  useEffect(() => () => clearTimers(), [clearTimers])

  return {
    stepIndex,
    visible,
    goToStep,
    tryReveal,
    fadeMs: ONBOARDING_FADE_MS,
  }
}
