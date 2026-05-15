import { defineConfig, devices } from '@playwright/test'

function e2eAuthConfigured(): boolean {
  const url = process.env.VITE_SUPABASE_URL ?? ''
  return Boolean(
    process.env.E2E_TEST_EMAIL &&
      process.env.E2E_TEST_PASSWORD &&
      process.env.VITE_SUPABASE_ANON_KEY &&
      url.length > 0 &&
      !url.includes('placeholder'),
  )
}

const port = process.env.PLAYWRIGHT_PORT ?? '5190'
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`
const isCI = !!process.env.CI

export default defineConfig({
  testIgnore: ['**/.claude/**', '**/node_modules/**', '**/dist/**'],
  fullyParallel: !isCI,
  forbidOnly: isCI,
  retries: 0,
  workers: isCI ? 1 : undefined,
  timeout: 30_000,
  expect: { timeout: 8_000 },
  reporter: isCI ? 'github' : 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL,
    navigationTimeout: 15_000,
    actionTimeout: 8_000,
    serviceWorkers: 'block',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    launchOptions: isCI ? { args: ['--disable-dev-shm-usage'] } : undefined,
  },
  webServer: {
    command: isCI
      ? `npx vite preview --host 127.0.0.1 --port ${port} --strictPort`
      : `npm run dev -- --host 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 60_000,
    stdout: /Local:\s+http/i,
    env: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ?? 'https://placeholder.supabase.co',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ?? 'placeholder-anon-key',
    },
  },
  projects: [
    { name: 'public', testDir: 'e2e/public' },
    ...(e2eAuthConfigured() || process.env.E2E_FORCE_AUTH === '1'
      ? [
          { name: 'setup', testDir: 'e2e', testMatch: /auth\.setup\.ts/ },
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
