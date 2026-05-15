import { test as setup, expect } from '@playwright/test'
import {
  e2eAuthConfigured,
  signInTestUser,
  supabaseAuthStorageKey,
} from './helpers/supabase-auth'

const AUTH_FILE = 'e2e/.auth/user.json'

setup('authenticate test user', async ({ page }) => {
  setup.skip(!e2eAuthConfigured(), 'E2E auth env not configured — see docs/e2e.md')

  const session = await signInTestUser()
  const supabaseUrl = process.env.VITE_SUPABASE_URL!
  const storageKey = supabaseAuthStorageKey(supabaseUrl)

  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  await page.evaluate(({ key, s }) => {
    localStorage.setItem(key, JSON.stringify(s))
  }, {
    key: storageKey,
    s: {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: session.expires_in,
      expires_at: session.expires_at,
      token_type: session.token_type,
      user: session.user,
    },
  })

  await page.goto('/album', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('navigation')).toBeVisible({ timeout: 45_000 })
  await expect(page.getByRole('button', { name: 'Add sticker' }).first()).toBeVisible({
    timeout: 45_000,
  })

  await page.context().storageState({ path: AUTH_FILE })
})
