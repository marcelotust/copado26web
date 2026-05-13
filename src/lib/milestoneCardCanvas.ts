import { teamColors } from '../utils'
import {
  CARD_H,
  CARD_W,
  drawMilestoneFooter,
  drawMilestoneStars,
  wrapCanvasLines,
} from './milestoneCardLayout'
import type { AlbumMilestoneDraw, MilestoneDrawInput, TeamMilestoneDraw } from './milestoneCardTypes'

function drawTeam(ctx: CanvasRenderingContext2D, input: TeamMilestoneDraw): void {
  const { primary, secondary } = teamColors(input.teamCode)
  const g = ctx.createLinearGradient(0, 0, CARD_W, CARD_H)
  g.addColorStop(0, primary)
  g.addColorStop(0.55, secondary)
  g.addColorStop(1, '#020617')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.font = 'bold 200px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif'
  ctx.fillText(input.flag, CARD_W / 2, 520)

  ctx.font = 'bold 64px system-ui, sans-serif'
  ctx.fillStyle = '#f8fafc'
  ctx.fillText(input.copy.teamHeadline, CARD_W / 2, 720)

  ctx.font = 'bold 88px system-ui, sans-serif'
  ctx.fillStyle = '#ffffff'
  const nameLines = wrapCanvasLines(ctx, input.name, CARD_W - 160, 72)
  let yName = 860
  for (const line of nameLines.slice(0, 3)) {
    ctx.fillText(line, CARD_W / 2, yName)
    yName += 96
  }

  drawMilestoneFooter(ctx, input.copy)
}

function drawAlbum(ctx: CanvasRenderingContext2D, input: AlbumMilestoneDraw): void {
  const bg = ctx.createLinearGradient(0, 0, 0, CARD_H)
  bg.addColorStop(0, '#020617')
  bg.addColorStop(0.45, '#0f172a')
  bg.addColorStop(1, '#020617')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, CARD_W, CARD_H)
  drawMilestoneStars(ctx)

  ctx.textAlign = 'center'
  ctx.font = 'bold 280px system-ui, sans-serif'
  ctx.fillStyle = '#fef08a'
  ctx.shadowColor = 'rgba(250, 204, 21, 0.45)'
  ctx.shadowBlur = 40
  ctx.fillText(`${input.pct}%`, CARD_W / 2, 780)
  ctx.shadowBlur = 0

  ctx.font = 'bold 72px system-ui, sans-serif'
  ctx.fillStyle = '#e2e8f0'
  const head = input.copy.albumHeadline(input.pct)
  for (const [i, line] of wrapCanvasLines(ctx, head, CARD_W - 120, 56).slice(0, 2).entries()) {
    ctx.fillText(line, CARD_W / 2, 920 + i * 72)
  }

  ctx.font = '52px system-ui, sans-serif'
  ctx.fillStyle = '#94a3b8'
  const sub = input.copy.albumSubline(input.pct)
  for (const [i, line] of wrapCanvasLines(ctx, sub, CARD_W - 120, 44).slice(0, 3).entries()) {
    ctx.fillText(line, CARD_W / 2, 1040 + i * 58)
  }

  ctx.font = '160px system-ui, sans-serif'
  ctx.fillText('🏆', CARD_W / 2, 1280)

  drawMilestoneFooter(ctx, input.copy)
}

export function drawMilestoneCard(ctx: CanvasRenderingContext2D, input: MilestoneDrawInput): void {
  if (input.kind === 'team') drawTeam(ctx, input)
  else drawAlbum(ctx, input)
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

export type { AlbumMilestoneDraw, MilestoneCardCopy, MilestoneDrawInput, TeamMilestoneDraw } from './milestoneCardTypes'
