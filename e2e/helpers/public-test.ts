import { test as base, expect } from '@playwright/test'

/** Public E2E — block Supabase so placeholder URLs do not hang navigation. */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route(/\.supabase\.co\//, (route) => route.abort('failed'))
    await use(page)
  },
})

export { expect }
