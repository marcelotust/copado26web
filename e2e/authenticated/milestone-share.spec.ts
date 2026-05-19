import { test, expect } from '@playwright/test'
import { MilestonePage } from './helpers/milestonePage'

test.describe('milestone share card', () => {
  test('opens the modal and renders a non-empty canvas for an album milestone', async ({ page }) => {
    const milestone = new MilestonePage(page)
    await milestone.seedAlbumMilestone(50)
    await milestone.openDashboard()
    await milestone.replayBadge(/50%|álbum|album/i)

    const canvas = milestone.modalCanvas()
    await expect(canvas).toBeVisible()

    // Sanity: dataURL has meaningful length and is a PNG.
    const dataUrl = await milestone.readCanvasDataUrl()
    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true)
    expect(dataUrl.length).toBeGreaterThan(2000)

    await expect(canvas).toHaveScreenshot('milestone-album-50.png', {
      maxDiffPixelRatio: 0.02,
    })
  })
})
