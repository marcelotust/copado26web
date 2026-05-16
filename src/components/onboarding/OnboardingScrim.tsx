import { useMemo } from 'react'
import { spotlightFrameStyle } from './overlayPosition'
import type { TargetRect } from './useOnboardingTargetRect'

type PanelRect = {
  top: number
  left: number
  width: number
  height: number
}

type ScrimPanel = PanelRect & { id: 'top' | 'bottom' | 'left' | 'right' }

type OnboardingScrimProps = {
  targetRect: TargetRect | null
}

const SCRIM_CLASS = 'absolute bg-slate-950/80 backdrop-blur-[2px] pointer-events-none'

function buildPanels(hole: PanelRect, viewportW: number, viewportH: number): ScrimPanel[] {
  const bottom = hole.top + hole.height
  const right = hole.left + hole.width
  const panels: ScrimPanel[] = [
    { id: 'top', top: 0, left: 0, width: viewportW, height: Math.max(0, hole.top) },
    { id: 'bottom', top: bottom, left: 0, width: viewportW, height: Math.max(0, viewportH - bottom) },
    { id: 'left', top: hole.top, left: 0, width: Math.max(0, hole.left), height: hole.height },
    { id: 'right', top: hole.top, left: right, width: Math.max(0, viewportW - right), height: hole.height },
  ]
  return panels.filter((panel) => panel.width > 0 && panel.height > 0)
}

export default function OnboardingScrim({ targetRect }: OnboardingScrimProps) {
  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 0
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 0

  const { panels, frameStyle } = useMemo(() => {
    if (!targetRect || viewportW === 0 || viewportH === 0) {
      return { panels: [] as ScrimPanel[], frameStyle: undefined }
    }

    const frame = spotlightFrameStyle(targetRect)
    if (!frame) return { panels: [] as ScrimPanel[], frameStyle: undefined }

    const hole: PanelRect = {
      top: frame.top as number,
      left: frame.left as number,
      width: frame.width as number,
      height: frame.height as number,
    }

    return {
      panels: buildPanels(hole, viewportW, viewportH),
      frameStyle: frame,
    }
  }, [targetRect, viewportH, viewportW])

  if (!targetRect) {
    return <div className={`${SCRIM_CLASS} inset-0`} aria-hidden />
  }

  return (
    <>
      {panels.map((panel) => (
        <div
          key={panel.id}
          className={SCRIM_CLASS}
          style={{
            top: panel.top,
            left: panel.left,
            width: panel.width,
            height: panel.height,
          }}
          aria-hidden
        />
      ))}
      {frameStyle && (
        <div
          className='pointer-events-none absolute rounded-xl border-2 border-amber-300 shadow-[0_0_36px_rgba(251,191,36,0.45)]'
          style={frameStyle}
          aria-hidden
        />
      )}
    </>
  )
}
