# E2E tests (Playwright)

## Projects

| Project | When it runs | Needs secrets |
|---------|----------------|---------------|
| `public` | Every PR (`e2e.yml`) | No — placeholder Supabase |
| `authenticated` | Nightly / manual (`e2e-authenticated.yml`) | Yes |

## Local — public only

```bash
npx playwright install chromium
npm run test:e2e -- --project=public
```

Starts Vite on port **5190** (override with `PLAYWRIGHT_PORT`).

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

## Out of scope

Scanner/OCR, magic-link email flows, Google OAuth UI, account deletion happy path (destructive; run manually).
