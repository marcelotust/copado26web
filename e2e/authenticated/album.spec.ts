import { test, expect } from '@playwright/test'

test.describe('album', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/album')
    await expect(page.getByRole('button', { name: 'Add sticker' }).first()).toBeVisible({
      timeout: 30_000,
    })
  })

  test('adds and removes a sticker copy', async ({ page }) => {
    const add = page.getByRole('button', { name: 'Add sticker' }).first()
    await add.click()
    await expect(page.getByRole('button', { name: 'Remove sticker' }).first()).toBeVisible()

    await page.getByRole('button', { name: 'Remove sticker' }).first().click()
    // qty was 1 → confirm modal may appear; confirm if visible
    const confirm = page.getByRole('button', { name: /sim|yes|confirmar/i })
    if (await confirm.isVisible({ timeout: 1500 }).catch(() => false)) {
      await confirm.click()
    }
    await expect(add).toBeVisible()
  })
})
