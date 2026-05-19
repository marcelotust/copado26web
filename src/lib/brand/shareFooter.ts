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
 * Canonical share signature appended to every text share flow
 * (missing, swaps, milestone, challenge). Locale-driven; the bare
 * `meualbum2026.app` URL is preserved so `tradeListParse.ts` keeps
 * detecting pasted lists from any locale.
 */
export function getShareSignature(t: (key: string) => string): string {
  return `\n\n${t('share.signature')}`
}

type FooterOpts = {
  width: number
  height: number
  flow: ShareFlow
  t: (key: string) => string
  /** Optional flavor line (e.g. "Copa do Mundo FIFA 2026"). */
  tagline?: string
}

/** Centralized brand strip — brand name, URL, QR — drawn at the bottom of an image share. */
export function drawImageBrandFooter(ctx: CanvasRenderingContext2D, opts: FooterOpts): void {
  const { width, height, flow, t, tagline } = opts
  const QR_SIZE = 200
  const PADDING = 60
  const stripY = height - QR_SIZE - 60
  const qrX = width - QR_SIZE - PADDING

  drawQrCode(ctx, buildShareUrl({ flow, medium: 'image' }), qrX, stripY, QR_SIZE)

  const textX = PADDING
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
