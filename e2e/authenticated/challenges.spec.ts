import { test, expect } from '@playwright/test'
import { CHALLENGES } from '../../src/data/challenges'

test.describe('challenges page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/challenges')
    await expect(page.getByRole('navigation')).toBeVisible({ timeout: 30_000 })
  })

  test('lists all 14 challenges with progress', async ({ page }) => {
    for (const c of CHALLENGES) {
      await expect(page.getByText(c.title, { exact: true })).toBeVisible()
    }
    await expect(page.locator('[class*="rounded-xl"][class*="border"]')).toHaveCount(14)
  })

  test('shows difficulty sections', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /fáceis|easy/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /médios|medium/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /difíceis|hard/i })).toBeVisible()
  })

  test('screenshot for visual review', async ({ page }) => {
    await page.screenshot({
      path: 'e2e/output/challenges-page.png',
      fullPage: true,
    })
  })
})
