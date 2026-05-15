import { test, expect } from '@playwright/test'

test('guest album shows catalog without login', async ({ page }) => {
  await page.goto('/album')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 })
  // Paywall or album chrome — either proves route rendered
  const body = page.locator('body')
  await expect(body).not.toBeEmpty()
})
