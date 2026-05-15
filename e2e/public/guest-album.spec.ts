import { test, expect } from '../helpers/public-test'

test('guest album renders catalog without login', async ({ page }) => {
  await page.goto('/album', { waitUntil: 'domcontentloaded' })

  // Header link to /login is always rendered for guests.
  await expect(page.getByRole('link', { name: /entrar|login|acceder/i })).toBeVisible({
    timeout: 15_000,
  })

  // Once stubbed catalog (teams + stickers_catalog) loads, the loading text disappears
  // and the team sidebar (<aside><nav>) renders — proves the Supabase stub was consumed.
  await expect(page.getByText(/Carregando álbum/i)).toHaveCount(0, { timeout: 15_000 })
  await expect(page.locator('aside nav')).toBeVisible()
})
