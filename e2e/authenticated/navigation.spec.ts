import { test, expect } from '@playwright/test'

const TABS = [
  { path: '/dashboard', name: /início|home/i },
  { path: '/album', name: /álbum|album/i },
  { path: '/missing', name: /faltam|missing/i },
  { path: '/swaps', name: /trocas|swaps/i },
]

test.describe('navigation', () => {
  for (const tab of TABS) {
    test(`tab ${tab.path} is reachable`, async ({ page }) => {
      await page.goto(tab.path)
      await expect(page.getByRole('navigation')).toBeVisible()
      await expect(page.getByRole('link', { name: tab.name }).first()).toBeVisible()
    })
  }

  test('challenges page loads from header', async ({ page }) => {
    await page.goto('/album')
    await page.getByRole('link', { name: /desafios|challenges/i }).click()
    await expect(page).toHaveURL(/\/challenges/)
  })
})
