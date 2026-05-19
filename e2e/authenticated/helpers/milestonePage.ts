import { expect, type Locator, type Page } from '@playwright/test'

/**
 * PageObject for the milestone modal share flow.
 * Seeds a milestone directly into localStorage (same shape used by
 * `src/lib/milestoneStorage.ts`), opens the dashboard, replays the badge,
 * and exposes the rendered canvas for screenshot / dataURL assertions.
 */
export class MilestonePage {
  constructor(private readonly page: Page) {}

  async seedAlbumMilestone(pct: 25 | 50 | 75 | 100): Promise<void> {
    await this.page.goto('/album', { waitUntil: 'domcontentloaded' })
    await this.page.evaluate((pctValue) => {
      const key = Object.keys(localStorage).find((k) => k.startsWith('sb-') && k.endsWith('-auth-token'))
      if (!key) throw new Error('supabase auth token not found in localStorage')
      const raw = localStorage.getItem(key)!
      const session = JSON.parse(raw) as { user?: { id?: string } }
      const userId = session.user?.id
      if (!userId) throw new Error('userId missing from supabase session')
      const milestonesKey = `meualbum2026.milestones.v1:${userId}`
      const events = [{ kind: 'album', pct: pctValue, at: Date.now() }]
      localStorage.setItem(milestonesKey, JSON.stringify({ v: 1, events }))
    }, pct)
  }

  async openDashboard(): Promise<void> {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(this.page.getByRole('heading', { name: /overall progress|progresso geral|progreso/i })).toBeVisible({
      timeout: 20_000,
    })
  }

  async replayBadge(label: RegExp | string): Promise<void> {
    const badge = this.page.getByRole('button', { name: label }).first()
    await expect(badge).toBeVisible({ timeout: 10_000 })
    await badge.click()
    await expect(this.page.getByRole('dialog')).toBeVisible({ timeout: 10_000 })
  }

  modalCanvas(): Locator {
    return this.page.getByRole('dialog').locator('canvas')
  }

  async readCanvasDataUrl(): Promise<string> {
    return this.modalCanvas().evaluate((el) => (el as HTMLCanvasElement).toDataURL('image/png'))
  }
}
