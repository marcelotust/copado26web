import { test, expect } from '../helpers/public-test'

test('guest album shows shell without login', async ({ page }) => {
  await page.goto('/album', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('link', { name: /entrar|login|acceder/i })).toBeVisible({ timeout: 15_000 })
})
