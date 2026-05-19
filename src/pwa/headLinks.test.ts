import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { BRAND_ASSET_VERSION, OG_IMAGE_URL } from './brandAssets'

const ROOT = resolve(import.meta.dirname, '../..')

describe('PWA head links (#165)', () => {
  const html = readFileSync(resolve(ROOT, 'index.html'), 'utf8')
  const manifest = JSON.parse(
    readFileSync(resolve(ROOT, 'public/manifest.webmanifest'), 'utf8'),
  ) as {
    theme_color: string
    background_color: string
    icons: Array<{ src: string; purpose?: string }>
  }

  it('declares favicon stack and web manifest', () => {
    expect(html).toContain('rel="icon" type="image/svg+xml" href="/favicon.svg"')
    expect(html).toContain('href="/favicon.ico"')
    expect(html).toContain('sizes="32x32" href="/favicon-32.png"')
    expect(html).toContain('sizes="16x16" href="/favicon-16.png"')
    expect(html).toContain('rel="manifest" href="/manifest.webmanifest"')
  })

  it('declares apple touch icon with size', () => {
    expect(html).toContain(
      'rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"',
    )
  })

  it('declares eight iOS splash startup images', () => {
    const splashLinks = html.match(/rel="apple-touch-startup-image"/g)
    expect(splashLinks).toHaveLength(8)
    expect(html).toContain('href="/splash/ios-750x1334.png"')
    expect(html).toContain('href="/splash/ios-2048x2732.png"')
  })

  it('cache-busts OG and Twitter image URLs', () => {
    expect(html).toContain(OG_IMAGE_URL)
    expect(OG_IMAGE_URL).toContain(`v=${BRAND_ASSET_VERSION}`)
  })

  it('manifest uses palette A and split icon purposes', () => {
    expect(manifest.theme_color).toBe('#0F172A')
    expect(manifest.background_color).toBe('#0F172A')
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: 'pwa-192.png', purpose: 'any' }),
        expect.objectContaining({ src: 'pwa-512.png', purpose: 'maskable' }),
      ]),
    )
  })
})
