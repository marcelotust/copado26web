# E2E smoke tests (Playwright)

## Local

```bash
npx playwright install chromium
npm run test:e2e
```

Starts `vite dev` on port **5173** (override with `PLAYWRIGHT_PORT`). Set `PLAYWRIGHT_SKIP_WEBSERVER=1` if the app is already running.

## CI

Workflow `.github/workflows/e2e.yml` runs on PRs with placeholder Supabase env. Tests cover landing, guest album, and login UI **without** real credentials.

## Authenticated flows (manual / staging)

Full album + settings smoke needs a test Supabase project:

```bash
export VITE_SUPABASE_URL=...
export VITE_SUPABASE_ANON_KEY=...
export E2E_TEST_EMAIL=...
npm run test:e2e
```

Do not use production user data.

## Artifacts

On failure, CI uploads Playwright HTML report and traces.
