import type { CSSProperties } from 'react'
import type { TargetRect } from './useOnboardingTargetRect'

const SPOTLIGHT_PADDING = 8
const PANEL_WIDTH = 352
const PANEL_HEIGHT = 244
const PANEL_GAP = 18

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function spotlightStyle(targetRect: TargetRect | null): CSSProperties | undefined {
  if (!targetRect) return undefined
  return {
    top: targetRect.top - SPOTLIGHT_PADDING,
    left: targetRect.left - SPOTLIGHT_PADDING,
    width: targetRect.width + SPOTLIGHT_PADDING * 2,
    height: targetRect.height + SPOTLIGHT_PADDING * 2,
  }
}

export function panelStyle(targetRect: TargetRect | null): CSSProperties {
  const maxLeft = Math.max(16, window.innerWidth - PANEL_WIDTH - 16)
  if (!targetRect) {
    return {
      left: clamp((window.innerWidth - PANEL_WIDTH) / 2, 16, maxLeft),
      top: clamp((window.innerHeight - PANEL_HEIGHT) / 2, 16, Math.max(16, window.innerHeight - PANEL_HEIGHT - 16)),
    }
  }

  const fitsBelow = targetRect.top + targetRect.height + PANEL_GAP + PANEL_HEIGHT < window.innerHeight
  return {
    left: clamp(targetRect.left + targetRect.width / 2 - PANEL_WIDTH / 2, 16, maxLeft),
    top: fitsBelow
      ? targetRect.top + targetRect.height + PANEL_GAP
      : Math.max(16, targetRect.top - PANEL_HEIGHT - PANEL_GAP),
  }
}
