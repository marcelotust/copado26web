import { drawImageBrandFooter } from './brand/shareFooter'
import type { MilestoneCardCopy } from './milestoneCardTypes'

export const CARD_W = 1080
export const CARD_H = 1920

export function drawMilestoneStars(ctx: CanvasRenderingContext2D): void {
  for (let i = 0; i < 88; i++) {
    const u = ((i * 7919) % 997) / 997
    const v = ((i * 5857) % 991) / 991
    const x = u * (CARD_W - 40) + 20
    const y = v * (CARD_H - 40) + 20
    const r = i % 4 === 0 ? 2.2 : 1.2
    const a = i % 5 === 0 ? 0.9 : 0.45
    ctx.beginPath()
    ctx.fillStyle = `rgba(255,255,255,${a})`
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
}

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

export function drawMilestoneFooter(ctx: CanvasRenderingContext2D, copy: MilestoneCardCopy): void {
  drawImageBrandFooter(ctx, {
    width: CARD_W,
    height: CARD_H,
    flow: 'milestone',
    t: copy.t,
    tagline: copy.tagline,
  })
}
