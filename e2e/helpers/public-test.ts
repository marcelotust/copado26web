import { test as base, expect } from '@playwright/test'
import { MOCK_STICKERS, MOCK_TEAMS } from './supabase-fixtures'

const THIRD_PARTY = /posthog|sentry\.io|jsdelivr\.net/i
const SUPABASE = /\.supabase\.co/i

/** Public E2E — stub Supabase catalog/auth and block analytics so CI cannot hang. */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route(SUPABASE, async (route) => {
      const url = route.request().url()
      if (url.includes('/auth/v1/')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({}),
        })
        return
      }
      if (url.includes('/rest/v1/teams')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_TEAMS),
        })
        return
      }
      if (url.includes('/rest/v1/stickers_catalog')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_STICKERS),
        })
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
      })
    })
    await page.route(THIRD_PARTY, (route) => route.abort('failed'))
    await use(page)
  },
})

export { expect }
