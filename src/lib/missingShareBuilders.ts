import type { MissingGroup } from '../state/stickersStore'
import { drawShareFooter } from './brand/shareFooter'
import { interpolate, pad } from './shareText'

export { pad } from './shareText'

const W = 1080
const H = 1920
const FOOTER_TOP = H - 320

export async function buildShareImage(
  groups: MissingGroup[],
  teamName: (code: string) => string,
  teamFlag: (code: string) => string,
  total: number,
  t: (key: string) => string,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#020617')
  bg.addColorStop(1, '#0f172a')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  const header = ctx.createLinearGradient(0, 0, W, 280)
  header.addColorStop(0, '#1e3a5f')
  header.addColorStop(1, '#0d2818')
  ctx.fillStyle = header
  ctx.fillRect(0, 0, W, 280)

  const brand = `⚽ ${t('share.appName')}`

  ctx.textAlign = 'center'
  ctx.font = 'bold 72px system-ui, sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(brand, W / 2, 120)

  ctx.font = '48px system-ui, sans-serif'
  ctx.fillStyle = '#93c5fd'
  ctx.fillText(interpolate(t('share.imageMissingCount'), { count: total }), W / 2, 200)

  ctx.textAlign = 'left'
  let y = 340
  for (const { teamCode, numbers } of groups) {
    if (y > FOOTER_TOP - 60) break
    ctx.font = 'bold 50px system-ui, sans-serif'
    ctx.fillStyle = '#f1f5f9'
    ctx.fillText(`${teamFlag(teamCode)} ${teamName(teamCode)} (${numbers.length})`, 80, y)
    ctx.font = '36px monospace'
    ctx.fillStyle = '#64748b'
    const preview = numbers.slice(0, 9).map(n => `${teamCode} ${pad(n)}`).join(' · ')
    const overflow = numbers.length > 9 ? ` +${numbers.length - 9}` : ''
    ctx.fillText(preview + overflow, 80, y + 44)
    y += 108
  }

  drawShareFooter(ctx, {
    width: W,
    height: H,
    flow: 'missing',
    t,
    tagline: t('milestone.tagline'),
  })

  return new Promise(resolve => canvas.toBlob(b => resolve(b!), 'image/png'))
}
