import { test, expect } from '@playwright/test'

test.describe('settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 20_000 })
  })

  test('exports album csv', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download', { timeout: 15_000 })
    await page.getByTestId('settings-export-csv').click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/\.csv$/i)
  })

  test('toggles analytics consent', async ({ page }) => {
    const enable = page.getByRole('button', { name: /ativar analytics|enable analytics|activar analytics/i })
    if (await enable.isVisible()) {
      await enable.click()
      await expect(page.getByText(/ativado|enabled|activado/i)).toBeVisible()
      await page.getByRole('button', { name: /desativar|disable|desactivar/i }).click()
      await expect(page.getByText(/desativado|disabled|desactivado/i)).toBeVisible()
      return
    }
    const disable = page.getByRole('button', { name: /desativar analytics|disable analytics/i })
    await expect(disable).toBeVisible()
  })
})
