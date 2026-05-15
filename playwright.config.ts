import { defineConfig, devices } from '@playwright/test'
import { e2eAuthConfigured } from './e2e/helpers/supabase-auth'

const port = process.env.PLAYWRIGHT_PORT ?? '5190'
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: `npm run dev -- --host 127.0.0.1 --port ${port}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ?? 'https://placeholder.supabase.co',
          VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ?? 'placeholder-anon-key',
        },
      },
  projects: [
    { name: 'public', testDir: 'e2e/public' },
    ...(e2eAuthConfigured() || process.env.E2E_FORCE_AUTH === '1'
      ? [
          { name: 'setup', testMatch: /auth\.setup\.ts/ },
          {
            name: 'authenticated',
            testDir: 'e2e/authenticated',
            dependencies: ['setup'],
            use: { storageState: 'e2e/.auth/user.json' },
          },
        ]
      : []),
  ],
})
