import { test, expect } from '@playwright/test'

test('guest album shows shell without login', async ({ page }) => {
  await page.goto('/album')
  await expect(page.getByRole('link', { name: /entrar|login|acceder/i })).toBeVisible({ timeout: 20_000 })
})
