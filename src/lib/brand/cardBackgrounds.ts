/**
 * Share-card background painters. Each fills the full canvas behind the
 * variant content. Pure-canvas (no external assets), deterministic, sync.
 */

export type CardBackground = 'stars' | 'beams' | 'halftone'

export function drawCardBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  background: CardBackground,
  opts?: { primary?: string; secondary?: string },
): void {
  switch (background) {
    case 'stars':    return drawStarsBg(ctx, width, height)
    case 'beams':    return drawBeamsBg(ctx, width, height, opts)
    case 'halftone': return drawHalftoneFoilBg(ctx, width, height)
  }
}

function drawStarsBg(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const bg = ctx.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, '#020617')
  bg.addColorStop(0.45, '#0f172a')
  bg.addColorStop(1, '#020617')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)
  for (let i = 0; i < 88; i++) {
    const u = ((i * 7919) % 997) / 997
    const v = ((i * 5857) % 991) / 991
    const x = u * (w - 40) + 20
    const y = v * (h - 40) + 20
    const r = i % 4 === 0 ? 2.2 : 1.2
    const a = i % 5 === 0 ? 0.9 : 0.45
    ctx.beginPath()
    ctx.fillStyle = `rgba(255,255,255,${a})`
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
}

/**
 * Stadium light beams — soft diagonal cones from the upper corners.
 * Primary/secondary color the beams so team-complete cards inherit the team palette.
 */
function drawBeamsBg(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  opts?: { primary?: string; secondary?: string },
): void {
  const base = ctx.createLinearGradient(0, 0, 0, h)
  base.addColorStop(0, '#020617')
  base.addColorStop(0.6, '#0b1224')
  base.addColorStop(1, '#020617')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)

  const primary = opts?.primary ?? 'rgba(254, 240, 138, 0.18)'
  const secondary = opts?.secondary ?? 'rgba(94, 234, 212, 0.14)'

  // left beam: from (0, -60) widening to (w*0.65, h)
  drawBeam(ctx, -120, -120, w * 0.55, h, primary)
  // right beam: from (w, -60) widening to (w*0.35, h)
  drawBeam(ctx, w + 120, -120, w * 0.45, h, secondary)

  // soft horizon glow at the bottom
  const glow = ctx.createRadialGradient(w / 2, h * 0.95, 40, w / 2, h * 0.95, w * 0.7)
  glow.addColorStop(0, 'rgba(99, 102, 241, 0.30)')
  glow.addColorStop(1, 'rgba(2, 6, 23, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, w, h)
}

function drawBeam(
  ctx: CanvasRenderingContext2D,
  topX: number, topY: number,
  bottomX: number, bottomY: number,
  color: string,
): void {
  ctx.save()
  const grad = ctx.createLinearGradient(topX, topY, bottomX, bottomY)
  grad.addColorStop(0, color)
  grad.addColorStop(0.6, color.replace(/[\d.]+\)/, '0.06)'))
  grad.addColorStop(1, 'rgba(2, 6, 23, 0)')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.moveTo(topX - 60, topY)
  ctx.lineTo(topX + 60, topY)
  ctx.lineTo(bottomX + 220, bottomY)
  ctx.lineTo(bottomX - 220, bottomY)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

const FOIL_STOPS: ReadonlyArray<[number, string]> = [
  [0, '#7eb8d4'],
  [0.25, '#d4568a'],
  [0.5, '#e8d060'],
  [0.75, '#3ec48a'],
  [1, '#5b8def'],
]

/** Halftone dot grid colored by foil gradient + faint vertical paper lines. */
function drawHalftoneFoilBg(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  // deep base
  const base = ctx.createLinearGradient(0, 0, w, h)
  base.addColorStop(0, '#0f172a')
  base.addColorStop(1, '#020617')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)

  // foil tint band — diagonal sweep
  const foil = ctx.createLinearGradient(0, 0, w, h)
  for (const [stop, color] of FOIL_STOPS) foil.addColorStop(stop, color)
  ctx.save()
  ctx.globalAlpha = 0.08
  ctx.fillStyle = foil
  ctx.fillRect(0, 0, w, h)
  ctx.restore()

  // halftone dots
  const STEP = 36
  ctx.save()
  for (let y = STEP; y < h - STEP; y += STEP) {
    for (let x = STEP; x < w - STEP; x += STEP) {
      const offset = (Math.floor(y / STEP) % 2 === 0) ? 0 : STEP / 2
      const xx = x + offset
      if (xx >= w - STEP) continue
      const dist = Math.hypot(xx - w / 2, y - h / 2)
      const fade = Math.max(0, 1 - dist / (w * 0.7))
      const radius = 1.6 + fade * 1.4
      ctx.beginPath()
      ctx.arc(xx, y, radius, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(226, 232, 240, ${0.10 + fade * 0.16})`
      ctx.fill()
    }
  }
  ctx.restore()

  // vertical paper lines, very faint
  ctx.save()
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.06)'
  ctx.lineWidth = 1
  for (let x = 0; x <= w; x += 60) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
    ctx.stroke()
  }
  ctx.restore()
}
