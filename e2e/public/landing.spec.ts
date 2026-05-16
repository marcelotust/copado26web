import { test, expect } from '../helpers/public-test'

test('landing page loads and links to login', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page).toHaveTitle(/álbum|album/i)
  await expect(page.locator('header a[href="/login"]').first()).toBeVisible()
})
