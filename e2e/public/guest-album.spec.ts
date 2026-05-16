import { test, expect } from '../helpers/public-test'

test('guest album renders catalog without login', async ({ page }) => {
  await page.goto('/album', { waitUntil: 'domcontentloaded' })

  await expect(page.locator('header a[href="/login"]').first()).toBeVisible({
    timeout: 15_000,
  })

  // Once stubbed catalog loads, the team sidebar renders (locale-agnostic).
  await expect(page.locator('aside nav')).toBeVisible({ timeout: 15_000 })
})
