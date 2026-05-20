import QRCode from 'qrcode'

export const BRAND_URL = 'https://meualbum2026.app'
export const BRAND_URL_DISPLAY = 'meualbum2026.app'
export const BRAND_NAME = 'Meu Álbum 2026'

export type ShareFlow = 'missing' | 'swaps' | 'milestone' | 'challenge'
export type ShareMedium = 'text' | 'image'

/**
 * Canonical share URL with UTM tracking.
 * Text shares use the bare URL so users don't paste tracking params;
 * image shares embed it inside the QR code, which round-trips to the landing.
 */
export function buildShareUrl(opts: { flow: ShareFlow; medium: ShareMedium }): string {
  if (opts.medium === 'text') return BRAND_URL
  const params = new URLSearchParams({
    utm_source: 'share_card',
    utm_medium: opts.medium,
    utm_campaign: opts.flow,
  })
  return `${BRAND_URL}/?${params.toString()}`
}

/**
 * Canonical share signature appended to every text share flow.
 * Locale-driven; the bare `meualbum2026.app` URL is preserved so
 * `tradeListParse.ts` keeps detecting pasted lists from any locale.
 */
export function getShareSignature(t: (key: string) => string): string {
  return `\n\n${t('share.signature')}`
}

const CARD_FOIL_STOPS: ReadonlyArray<[number, string]> = [
  [0,    '#7a99d6'],
  [0.25, '#6db9c7'],
  [0.5,  '#c97ab8'],
  [0.75, '#e0c177'],
  [1,    '#5fb591'],
]

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

/**
 * Selo 26 — three-card sticker stack with rainbow paper card and yellow "+" badge.
 * Drawn pure-canvas in the SVG 0..100 logical viewBox, then mapped to a
 * `2*radius` square centered at (cx, cy).
 */
export function drawSelo26(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
): void {
  ctx.save()
  const scale = (2 * radius) / 100
  ctx.translate(cx - radius, cy - radius)
  ctx.scale(scale, scale)

  roundRectPath(ctx, 0, 0, 100, 100, 20)
  ctx.fillStyle = '#0F172A'
  ctx.fill()

  const drawCard = (rotDeg: number, fill: string, x: number, y: number, w: number, h: number, rx: number, strokeStyle: string | CanvasGradient, strokeWidth: number) => {
    ctx.save()
    ctx.translate(50, 56)
    ctx.rotate((rotDeg * Math.PI) / 180)
    ctx.translate(-50, -56)
    roundRectPath(ctx, x, y, w, h, rx)
    ctx.fillStyle = fill
    ctx.fill()
    ctx.strokeStyle = strokeStyle
    ctx.lineWidth = strokeWidth
    ctx.stroke()
    ctx.restore()
  }

  drawCard(-16, '#5fb591', 30, 22, 40, 56, 5, '#0F172A', 1.4)
  drawCard(9,   '#c97ab8', 30, 22, 40, 56, 5, '#0F172A', 1.4)

  ctx.save()
  ctx.translate(50, 56)
  ctx.rotate((-3 * Math.PI) / 180)
  ctx.translate(-50, -56)

  roundRectPath(ctx, 28, 20, 44, 60, 6)
  ctx.fillStyle = '#F6F4EE'
  ctx.fill()
  const foil = ctx.createLinearGradient(28, 20, 72, 80)
  for (const [stop, color] of CARD_FOIL_STOPS) foil.addColorStop(stop, color)
  ctx.strokeStyle = foil
  ctx.lineWidth = 1.6
  ctx.stroke()

  ctx.fillStyle = '#0F172A'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '900 34px Impact, "Arial Narrow", sans-serif'
  ctx.fillText('26', 50, 52)

  ctx.beginPath()
  ctx.arc(68, 24, 8.5, 0, Math.PI * 2)
  ctx.fillStyle = '#e0c177'
  ctx.fill()
  ctx.strokeStyle = '#0F172A'
  ctx.lineWidth = 1.6
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(68, 19.5)
  ctx.lineTo(68, 28.5)
  ctx.moveTo(63.5, 24)
  ctx.lineTo(72.5, 24)
  ctx.strokeStyle = '#0F172A'
  ctx.lineWidth = 2.2
  ctx.lineCap = 'round'
  ctx.stroke()

  ctx.restore()
  ctx.restore()
}

type HeaderOpts = {
  width: number
  height: number
  t: (key: string) => string
  /** Optional eyebrow text rendered above the wordmark (e.g. tagline). */
  eyebrow?: string
}

/** Shared header strip drawn at the top of every share card. */
export function drawShareHeader(ctx: CanvasRenderingContext2D, opts: HeaderOpts): void {
  const { eyebrow } = opts
  const PADDING = 60
  const SELO_R = 56
  const seloCx = PADDING + SELO_R
  const seloCy = PADDING + SELO_R

  drawSelo26(ctx, seloCx, seloCy, SELO_R)

  ctx.save()
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#f8fafc'
  ctx.font = 'bold 52px system-ui, sans-serif'
  const wordmarkX = seloCx + SELO_R + 28
  ctx.fillText(BRAND_NAME, wordmarkX, seloCy + 4)

  if (eyebrow) {
    ctx.fillStyle = '#94a3b8'
    ctx.font = '28px system-ui, sans-serif'
    ctx.fillText(eyebrow, wordmarkX, seloCy + 44)
  }
  ctx.restore()
}

type FooterOpts = {
  width: number
  height: number
  flow: ShareFlow
  t: (key: string) => string
  /** Optional flavor line (e.g. "Copa do Mundo FIFA 2026"). */
  tagline?: string
}

/** Shared brand strip — brand name, URL, QR — drawn at the bottom of every share card. */
export function drawShareFooter(ctx: CanvasRenderingContext2D, opts: FooterOpts): void {
  const { width, height, flow, t, tagline } = opts
  const QR_SIZE = 200
  const PADDING = 60
  const stripY = height - QR_SIZE - 60
  const qrX = width - QR_SIZE - PADDING

  drawQrCode(ctx, buildShareUrl({ flow, medium: 'image' }), qrX, stripY, QR_SIZE)

  const textX = PADDING
  ctx.save()
  ctx.textAlign = 'left'
  ctx.fillStyle = '#f1f5f9'
  ctx.font = 'bold 56px system-ui, sans-serif'
  ctx.fillText(BRAND_NAME, textX, stripY + 60)

  ctx.fillStyle = '#94a3b8'
  ctx.font = '36px system-ui, sans-serif'
  ctx.fillText(BRAND_URL_DISPLAY, textX, stripY + 110)

  if (tagline) {
    ctx.fillStyle = '#64748b'
    ctx.font = '28px system-ui, sans-serif'
    ctx.fillText(tagline, textX, stripY + 160)
  }

  ctx.fillStyle = '#475569'
  ctx.font = '24px system-ui, sans-serif'
  ctx.fillText(t('share.scanCta'), textX, stripY + 200)
  ctx.restore()
}

function drawQrCode(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
): void {
  const code = QRCode.create(text, { errorCorrectionLevel: 'M' })
  const matrixSize = code.modules.size
  const data = code.modules.data
  const cell = size / matrixSize

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(x, y, size, size)
  ctx.fillStyle = '#020617'
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (data[r * matrixSize + c]) {
        ctx.fillRect(x + c * cell, y + r * cell, cell, cell)
      }
    }
  }
}
