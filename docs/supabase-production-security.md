# Supabase Production Security Checklist

This checklist covers the project-level Supabase controls that cannot be
validated from the application code alone. Review it before production launch
and repeat the review every quarter.

## Scope

- Production app URL: `https://www.meualbum2026.app` (apex `meualbum2026.app` redirects to `www`)
- Supabase project: production project used by Vercel `Production`
- Responsible owner: GitHub repository owner `marcelotust` or the current
  Supabase/Vercel project admin
- Review cadence: quarterly, and after any auth, database, or deployment change

## Dashboard Links

Replace `<project-ref>` with the production Supabase project ref.

- URL configuration: `https://supabase.com/dashboard/project/<project-ref>/auth/url-configuration`
- Auth providers and email settings: `https://supabase.com/dashboard/project/<project-ref>/auth/providers`
- API keys: `https://supabase.com/dashboard/project/<project-ref>/settings/api`
- Realtime publication: `https://supabase.com/dashboard/project/<project-ref>/database/replication`
- Auth logs: `https://supabase.com/dashboard/project/<project-ref>/logs/auth-logs`
- Postgres logs: `https://supabase.com/dashboard/project/<project-ref>/logs/postgres-logs`

## Launch Checklist

### Auth URLs

- `Site URL` is the production origin: `https://www.meualbum2026.app`.
- `Redirect URLs` contains only explicit allowed origins:
  - `https://www.meualbum2026.app/**`
  - `https://meualbum2026.app/**` (apex redirect to `www`)
  - preview URLs only when previews are intentionally enabled
  - `http://localhost:5173/**` only for local development projects, not
    production
- Avoid broad wildcard redirects such as `https://*.vercel.app/**` in
  production unless the matching preview deployment policy is documented.
- The app sends `emailRedirectTo` and OAuth `redirectTo` from
  `window.location.origin`; any origin not listed above should fail closed.

### OTP and Magic Link Abuse

- Email OTP and magic-link rate limits are enabled in Supabase Auth.
- CAPTCHA or equivalent abuse protection is enabled if public traffic or spam
  attempts increase.
- Auth failure logs are monitored for repeated requests from the same IP,
  domain, or email pattern.
- User-facing auth errors remain generic and do not expose raw Supabase error
  messages.

### API Keys and Environment Variables

- Vercel exposes only browser-safe variables to the client:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - optional public client keys such as `VITE_SENTRY_DSN`
- `service_role` is not committed, not present in `VITE_*` variables, and not
  available to browser bundles.
- If `E2E_SUPABASE_SERVICE_ROLE_KEY` is used, it is scoped to CI secrets and a
  dedicated non-production Supabase project.
- Rotate Supabase keys after accidental exposure or maintainer access changes.

### Realtime, RLS, and RPCs

- RLS is enabled for public tables that contain user data.
- `user_stickers` remains readable and writable only by `auth.uid() = user_id`.
- `adjust_sticker` stays `SECURITY DEFINER`, revokes `public`, and grants
  execute only to `authenticated`.
- Realtime publication includes only tables intentionally synced by the app.
- Realtime reads continue to rely on RLS; do not add service-role clients to
  browser code.

### Audit and Logs

- Auth failure logs are enabled and checked during the quarterly review.
- Postgres logs are checked after each migration for RLS or RPC errors.
- Sensitive account actions continue to write sanitized `audit_events` rows.
- Migration review includes RLS policies, grants, function ownership, and
  `search_path` for every new `SECURITY DEFINER` function.

## Quarterly Review Record

Append a dated note in the project runbook or issue tracker with:

- reviewer
- Supabase project ref reviewed
- redirects confirmed
- OTP abuse controls confirmed
- exposed Vercel variables reviewed
- Realtime/RLS policies reviewed
- auth and Postgres logs sampled
- follow-up issues opened, if any
