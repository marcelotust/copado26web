import { test as base, expect } from '@playwright/test'

const BLOCKED = /\.supabase\.co|posthog|sentry\.io|jsdelivr\.net/i

/** Public E2E — block third-party calls so placeholder URLs / analytics cannot hang tests. */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route(BLOCKED, (route) => route.abort('failed'))
    await use(page)
  },
})

export { expect }
