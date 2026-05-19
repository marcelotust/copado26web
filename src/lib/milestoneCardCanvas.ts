import { teamColors } from '../utils'
import { drawCardBackground } from './brand/cardBackgrounds'
import {
  CARD_CONTENT_TOP,
  CARD_H,
  CARD_W,
  drawMilestoneFooter,
  drawMilestoneHeader,
  wrapCanvasLines,
} from './milestoneCardLayout'
import type {
  FoilMilestoneDraw,
  GenericMilestoneDraw,
  MilestoneDrawInput,
  PctMilestoneDraw,
  TeamCompleteMilestoneDraw,
} from './milestoneCardTypes'

function drawSlotPlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  opts: { label?: string; owned?: boolean; tint?: string },
): void {
  const radius = 14
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + w - radius, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
  ctx.lineTo(x + w, y + h - radius)
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
  ctx.lineTo(x + radius, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()

  const filled = opts.owned !== false
  if (filled) {
    const g = ctx.createLinearGradient(x, y, x + w, y + h)
    g.addColorStop(0, opts.tint ?? '#1e293b')
    g.addColorStop(1, '#0f172a')
    ctx.fillStyle = g
  } else {
    ctx.fillStyle = 'rgba(148,163,184,0.12)'
  }
  ctx.fill()

  ctx.lineWidth = 2
  ctx.strokeStyle = filled ? 'rgba(255,255,255,0.18)' : 'rgba(148,163,184,0.28)'
  ctx.stroke()

  if (opts.label) {
    ctx.fillStyle = filled ? '#e2e8f0' : '#475569'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `bold ${Math.round(Math.min(w, h) * 0.32)}px system-ui, sans-serif`
    ctx.fillText(opts.label, x + w / 2, y + h / 2)
  }
  ctx.restore()
}

function drawPctGrid(
  ctx: CanvasRenderingContext2D,
  slots: ReadonlyArray<{ owned: boolean }>,
  top: number,
): void {
  const COLS = 4
  const ROWS = 3
  const SLOT_W = 200
  const SLOT_H = 260
  const GAP_X = 30
  const GAP_Y = 28
  const gridW = COLS * SLOT_W + (COLS - 1) * GAP_X
  const startX = (CARD_W - gridW) / 2
  for (let i = 0; i < COLS * ROWS; i++) {
    const r = Math.floor(i / COLS)
    const c = i % COLS
    const slot = slots[i] ?? { owned: false }
    drawSlotPlaceholder(
      ctx,
      startX + c * (SLOT_W + GAP_X),
      top + r * (SLOT_H + GAP_Y),
      SLOT_W, SLOT_H,
      { label: String(i + 1).padStart(2, '0'), owned: slot.owned },
    )
  }
}

/**
 * Fan of 5 mini-stickers (rotations -22°/-11°/0°/+11°/+22°), centered.
 * The remaining 15 are represented by a "20 ★" badge at the top-right of the fan.
 */
function drawTeamFan(
  ctx: CanvasRenderingContext2D,
  labels: ReadonlyArray<string>,
  tint: string,
  centerX: number,
  centerY: number,
): void {
  const CARD_W_FAN = 240
  const CARD_H_FAN = 340
  const X_STEP = 190
  const ANGLES = [-22, -11, 0, 11, 22]
  for (let i = 0; i < ANGLES.length; i++) {
    const angleDeg = ANGLES[i]!
    const offsetIdx = i - 2
    const x = centerX + offsetIdx * X_STEP
    const y = centerY + Math.abs(offsetIdx) * 26
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate((angleDeg * Math.PI) / 180)
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)'
    ctx.shadowBlur = 32
    ctx.shadowOffsetY = 10
    drawSlotPlaceholder(
      ctx,
      -CARD_W_FAN / 2, -CARD_H_FAN / 2,
      CARD_W_FAN, CARD_H_FAN,
      { label: labels[i] ?? String(i + 1).padStart(2, '0'), owned: true, tint },
    )
    ctx.restore()
  }
  drawTotalBadge(ctx, centerX + 380, centerY - 240, 20)
}

function drawTotalBadge(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  total: number,
): void {
  const r = 110
  ctx.save()
  ctx.shadowColor = 'rgba(254, 240, 138, 0.55)'
  ctx.shadowBlur = 30
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r)
  grad.addColorStop(0, '#fef08a')
  grad.addColorStop(1, '#facc15')
  ctx.fillStyle = grad
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)'
  ctx.lineWidth = 3
  ctx.stroke()

  ctx.fillStyle = '#0f172a'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = 'bold 56px system-ui, sans-serif'
  ctx.fillText(String(total), cx, cy - 10)
  ctx.font = 'bold 32px system-ui, sans-serif'
  ctx.fillText('★', cx, cy + 30)
  ctx.restore()
}

function drawPct(ctx: CanvasRenderingContext2D, input: PctMilestoneDraw): void {
  drawCardBackground(ctx, CARD_W, CARD_H, input.background ?? 'beams', {
    primary: 'rgba(254, 240, 138, 0.20)',
    secondary: 'rgba(94, 234, 212, 0.14)',
  })
  drawMilestoneHeader(ctx, input.copy)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#fef08a'
  ctx.shadowColor = 'rgba(250, 204, 21, 0.45)'
  ctx.shadowBlur = 40
  ctx.font = 'bold 240px system-ui, sans-serif'
  ctx.fillText(`${input.pct}%`, CARD_W / 2, 460)
  ctx.shadowBlur = 0

  ctx.fillStyle = '#e2e8f0'
  ctx.font = 'bold 56px system-ui, sans-serif'
  for (const [i, line] of wrapCanvasLines(ctx, input.headline, CARD_W - 160, 50).slice(0, 2).entries()) {
    ctx.fillText(line, CARD_W / 2, 560 + i * 64)
  }

  ctx.fillStyle = '#94a3b8'
  ctx.font = '36px system-ui, sans-serif'
  for (const [i, line] of wrapCanvasLines(ctx, input.subline, CARD_W - 200, 32).slice(0, 2).entries()) {
    ctx.fillText(line, CARD_W / 2, 640 + i * 44)
  }

  const totalSlots = 12
  const slots = input.slots
    ?? Array.from({ length: totalSlots }, (_, i) => ({ owned: i < Math.round(totalSlots * (input.pct / 100)) }))
  drawPctGrid(ctx, slots, 720)

  drawMilestoneFooter(ctx, input.copy)
}

function drawTeamComplete(ctx: CanvasRenderingContext2D, input: TeamCompleteMilestoneDraw): void {
  const { primary, secondary } = teamColors(input.teamCode)
  drawCardBackground(ctx, CARD_W, CARD_H, input.background ?? 'halftone', {
    primary, secondary,
  })

  // Subtle team-color overlay (so the team identity reads through halftone).
  ctx.save()
  ctx.globalAlpha = 0.18
  const tint = ctx.createLinearGradient(0, 0, 0, CARD_H)
  tint.addColorStop(0, primary)
  tint.addColorStop(0.5, secondary)
  tint.addColorStop(1, '#020617')
  ctx.fillStyle = tint
  ctx.fillRect(0, 0, CARD_W, CARD_H)
  ctx.restore()

  drawMilestoneHeader(ctx, input.copy)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = 'rgba(255,255,255,0.95)'
  ctx.font = 'bold 180px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif'
  ctx.fillText(input.flag, CARD_W / 2, 420)

  ctx.fillStyle = '#f8fafc'
  ctx.font = 'bold 72px system-ui, sans-serif'
  for (const [i, line] of wrapCanvasLines(ctx, input.headline, CARD_W - 160, 64).slice(0, 2).entries()) {
    ctx.fillText(line, CARD_W / 2, 510 + i * 84)
  }

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 56px system-ui, sans-serif'
  for (const [i, line] of wrapCanvasLines(ctx, input.name, CARD_W - 160, 48).slice(0, 2).entries()) {
    ctx.fillText(line, CARD_W / 2, 630 + i * 64)
  }

  const labels = input.slotLabels
    ?? Array.from({ length: 20 }, (_, i) => `${input.teamCode} ${String(i + 1).padStart(2, '0')}`)
  drawTeamFan(ctx, labels.slice(0, 5), secondary, CARD_W / 2, 1080)

  drawMilestoneFooter(ctx, input.copy)
}

function drawFoil(ctx: CanvasRenderingContext2D, input: FoilMilestoneDraw): void {
  drawCardBackground(ctx, CARD_W, CARD_H, input.background ?? 'halftone')
  drawMilestoneHeader(ctx, input.copy)

  const cardW = 540
  const cardH = 760
  const cardX = (CARD_W - cardW) / 2
  const cardY = CARD_CONTENT_TOP + 80

  ctx.save()
  ctx.shadowColor = 'rgba(232, 208, 96, 0.55)'
  ctx.shadowBlur = 60
  drawSlotPlaceholder(ctx, cardX, cardY, cardW, cardH, {
    label: `${input.teamCode} ${String(input.stickerNumber).padStart(2, '0')}`,
    owned: true,
    tint: '#d4568a',
  })
  ctx.restore()

  ctx.textAlign = 'center'
  ctx.fillStyle = '#fef08a'
  ctx.font = 'bold 64px system-ui, sans-serif'
  for (const [i, line] of wrapCanvasLines(ctx, input.headline, CARD_W - 160, 56).slice(0, 2).entries()) {
    ctx.fillText(line, CARD_W / 2, cardY + cardH + 80 + i * 72)
  }

  ctx.fillStyle = '#e2e8f0'
  ctx.font = '44px system-ui, sans-serif'
  ctx.fillText(`${input.flag} ${input.stickerName}`, CARD_W / 2, cardY + cardH + 200)

  ctx.fillStyle = '#94a3b8'
  ctx.font = '34px system-ui, sans-serif'
  for (const [i, line] of wrapCanvasLines(ctx, input.subline, CARD_W - 200, 30).slice(0, 2).entries()) {
    ctx.fillText(line, CARD_W / 2, cardY + cardH + 270 + i * 44)
  }

  drawMilestoneFooter(ctx, input.copy)
}

function drawGeneric(ctx: CanvasRenderingContext2D, input: GenericMilestoneDraw): void {
  drawCardBackground(ctx, CARD_W, CARD_H, input.background ?? 'beams')
  drawMilestoneHeader(ctx, input.copy)

  ctx.textAlign = 'center'
  ctx.fillStyle = '#fde68a'
  ctx.font = '260px system-ui, "Apple Color Emoji", sans-serif'
  ctx.fillText('★', CARD_W / 2, CARD_CONTENT_TOP + 240)

  ctx.fillStyle = '#94a3b8'
  ctx.font = 'bold 36px system-ui, sans-serif'
  ctx.fillText(input.eyebrow.toUpperCase(), CARD_W / 2, CARD_CONTENT_TOP + 380)

  ctx.fillStyle = '#f8fafc'
  ctx.font = 'bold 88px system-ui, sans-serif'
  for (const [i, line] of wrapCanvasLines(ctx, input.hero, CARD_W - 120, 80).slice(0, 3).entries()) {
    ctx.fillText(line, CARD_W / 2, CARD_CONTENT_TOP + 480 + i * 104)
  }

  if (input.sub) {
    ctx.fillStyle = '#e2e8f0'
    ctx.font = '48px system-ui, sans-serif'
    for (const [i, line] of wrapCanvasLines(ctx, input.sub, CARD_W - 160, 42).slice(0, 3).entries()) {
      ctx.fillText(line, CARD_W / 2, CARD_CONTENT_TOP + 800 + i * 60)
    }
  }

  if (input.subtitle) {
    ctx.fillStyle = '#94a3b8'
    ctx.font = '34px system-ui, sans-serif'
    for (const [i, line] of wrapCanvasLines(ctx, input.subtitle, CARD_W - 200, 30).slice(0, 2).entries()) {
      ctx.fillText(line, CARD_W / 2, CARD_CONTENT_TOP + 980 + i * 44)
    }
  }

  drawMilestoneFooter(ctx, input.copy)
}

export function drawMilestoneCard(ctx: CanvasRenderingContext2D, input: MilestoneDrawInput): void {
  switch (input.variant) {
    case 'pct':            return drawPct(ctx, input)
    case 'team-complete':  return drawTeamComplete(ctx, input)
    case 'foil':           return drawFoil(ctx, input)
    case 'generic':        return drawGeneric(ctx, input)
  }
}

export async function milestoneCardToBlob(input: MilestoneDrawInput): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = CARD_W
  canvas.height = CARD_H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas unsupported')
  drawMilestoneCard(ctx, input)
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png')
  })
}

export type {
  FoilMilestoneDraw,
  GenericMilestoneDraw,
  MilestoneCardVariant,
  MilestoneDrawInput,
  PctMilestoneDraw,
  TeamCompleteMilestoneDraw,
} from './milestoneCardTypes'
