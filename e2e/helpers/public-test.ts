import { test as base, expect } from '@playwright/test'
import { MOCK_STICKERS, MOCK_TEAMS } from './supabase-fixtures'

const THIRD_PARTY = /posthog|sentry\.io|jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com/i
const SUPABASE = /\.supabase\.co/i

const INIT_SCRIPT = `
(() => {
  const orig = window.fetch.bind(window)
  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input)
    if (/\\.supabase\\.co/.test(url)) {
      if (url.includes('/rest/v1/teams')) {
        return new Response(JSON.stringify(${JSON.stringify(MOCK_TEAMS)}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      if (url.includes('/rest/v1/stickers_catalog')) {
        return new Response(JSON.stringify(${JSON.stringify(MOCK_STICKERS)}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      if (url.includes('/auth/v1/')) {
        return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    return orig(input, init)
  }
})()
`

/** Public E2E — stub Supabase catalog/auth and block analytics so CI cannot hang. */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(INIT_SCRIPT)
    await page.route(SUPABASE, async (route) => {
      const url = route.request().url()
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
      if (url.includes('/auth/v1/')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({}),
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
