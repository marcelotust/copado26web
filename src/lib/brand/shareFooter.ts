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

const FOIL_STOPS: ReadonlyArray<[number, string]> = [
  [0,    '#7eb8d4'],
  [0.2,  '#d4568a'],
  [0.4,  '#e8d060'],
  [0.6,  '#3ec48a'],
  [0.8,  '#5b8def'],
  [1,    '#7eb8d4'],
]

function foilGradient(
  ctx: CanvasRenderingContext2D,
  x0: number, y0: number, x1: number, y1: number,
): CanvasGradient {
  const g = ctx.createLinearGradient(x0, y0, x1, y1)
  for (const [stop, color] of FOIL_STOPS) g.addColorStop(stop, color)
  return g
}

/** Selo 26 — dark coin with foil "26", drawn pure-canvas (no SVG loading). */
export function drawSelo26(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
): void {
  const grad = foilGradient(ctx, cx - radius, cy - radius, cx + radius, cy + radius)

  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fillStyle = grad
  ctx.fill()

  ctx.beginPath()
  ctx.arc(cx, cy, radius * 0.91, 0, Math.PI * 2)
  ctx.fillStyle = '#0f172a'
  ctx.fill()

  ctx.save()
  ctx.fillStyle = grad
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `bold ${Math.round(radius * 0.95)}px system-ui, sans-serif`
  ctx.fillText('26', cx, cy + radius * 0.04)
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
