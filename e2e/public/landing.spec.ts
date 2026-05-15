import { test, expect } from '@playwright/test'

test('landing page loads and links to login', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/álbum|album/i)
  const loginLink = page.getByRole('link', { name: /entrar|login|acceder/i })
  await expect(loginLink).toBeVisible()
})
