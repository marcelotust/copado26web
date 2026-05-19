import { drawShareFooter, drawShareHeader } from './brand/shareFooter'
import type { MilestoneCardCommonCopy } from './milestoneCardTypes'

export const CARD_W = 1080
export const CARD_H = 1920
export const CARD_CONTENT_TOP = 200
export const CARD_CONTENT_BOTTOM = CARD_H - 360

export function wrapCanvasLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontSize: number,
): string[] {
  ctx.font = `bold ${fontSize}px system-ui, sans-serif`
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const trial = line ? `${line} ${w}` : w
    if (ctx.measureText(trial).width <= maxWidth) line = trial
    else {
      if (line) lines.push(line)
      line = w
    }
  }
  if (line) lines.push(line)
  return lines.length ? lines : [text]
}

export function drawMilestoneHeader(
  ctx: CanvasRenderingContext2D,
  copy: MilestoneCardCommonCopy,
): void {
  drawShareHeader(ctx, { width: CARD_W, height: CARD_H, t: copy.t, eyebrow: copy.tagline })
}

export function drawMilestoneFooter(
  ctx: CanvasRenderingContext2D,
  copy: MilestoneCardCommonCopy,
): void {
  drawShareFooter(ctx, {
    width: CARD_W,
    height: CARD_H,
    flow: 'milestone',
    t: copy.t,
    tagline: copy.tagline,
  })
}
