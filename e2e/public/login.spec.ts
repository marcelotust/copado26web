import { test, expect } from '@playwright/test'

test('login form shows email and Google options', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByPlaceholder(/email|correo/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /google/i })).toBeVisible()
})
