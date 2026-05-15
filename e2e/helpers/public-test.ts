import { test as base, expect } from '@playwright/test'

const BLOCKED = /\.supabase\.co|posthog|sentry\.io|jsdelivr\.net/i

/** Public E2E — stub/block third-party calls so auth and analytics cannot hang tests. */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route(BLOCKED, async (route) => {
      const url = route.request().url()
      if (url.includes('/auth/v1/')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({}),
        })
        return
      }
      await route.abort('failed')
    })
    await use(page)
  },
})

export { expect }
