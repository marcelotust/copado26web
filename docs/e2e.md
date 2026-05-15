# E2E tests (Playwright)

## Projects

| Project | When it runs | Needs secrets |
|---------|----------------|---------------|
| `public` | Every PR (`e2e.yml`) | No — placeholder Supabase |
| `authenticated` | Nightly / manual (`e2e-authenticated.yml`) | Yes |

## CI status

The `e2e` workflow on pull requests is **informational** (`continue-on-error: true`) until smoke tests are stable on `main`. The `check` workflow (lint, typecheck, unit) remains required.

## Local — public only

```bash
npx playwright install chromium
npm run build
VITE_SUPABASE_URL=https://placeholder.supabase.co VITE_SUPABASE_ANON_KEY=placeholder-anon-key npm run test:e2e:public
```

Locally without a prior build, Playwright starts Vite dev on port **5190** (override with `PLAYWRIGHT_PORT`).  
CI runs `npm run build` first; Playwright then starts `vite preview` via `webServer` in [`playwright.config.ts`](../playwright.config.ts).

Public tests:

- Block **service workers** (`serviceWorkers: 'block'`)
- Stub Supabase **auth** and **catalog** (`teams`, `stickers_catalog`) via [`e2e/helpers/public-test.ts`](../e2e/helpers/public-test.ts)
- Abort PostHog, Sentry, and CDN requests

## Local — authenticated suite

1. Create a **dedicated Supabase test project** (never production).
2. Enable email+password for a test user, or set `E2E_SUPABASE_SERVICE_ROLE_KEY` to auto-create.
3. Export env:

```bash
export VITE_SUPABASE_URL=https://xxx.supabase.co
export VITE_SUPABASE_ANON_KEY=eyJ...
export E2E_TEST_EMAIL=e2e@your-test-domain.com
export E2E_TEST_PASSWORD='strong-test-password'
# optional: E2E_SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

4. Run:

```bash
npm run test:e2e:auth
# or full suite when env is set:
npm run test:e2e
```

Session is saved to `e2e/.auth/user.json` (gitignored).

## What is covered

**Public:** landing, guest `/album`, login form.

**Authenticated:** auth setup, album +/- sticker, settings export CSV, analytics toggle, main tabs, challenges.

## CI secrets (authenticated workflow)

| Secret | Purpose |
|--------|---------|
| `VITE_SUPABASE_URL` | Test project URL |
| `VITE_SUPABASE_ANON_KEY` | Anon key |
| `E2E_TEST_EMAIL` | Test account email |
| `E2E_TEST_PASSWORD` | Test account password |
| `E2E_SUPABASE_SERVICE_ROLE_KEY` | Optional — create/reset test user |

## Re-enabling the PR gate

After two or three consecutive green `e2e` runs on `main`:

1. Remove `continue-on-error: true` from [`.github/workflows/e2e.yml`](../.github/workflows/e2e.yml).
2. In GitHub **Settings → Branches**, add the `e2e` check as required (if used).

## Out of scope

Scanner/OCR, magic-link email flows, Google OAuth UI, account deletion happy path (destructive; run manually).
