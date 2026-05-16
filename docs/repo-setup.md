# Repo Setup

GitHub-side settings load-bearing for the AI-assisted workflow. Configure via
`Settings -> Branches -> main` or `gh api`.

## Branch protection on `main`

Required:

- Require pull request before merging
- Require approvals: 1
- Dismiss stale reviews when new commits are pushed
- Require review from Code Owners
- Require status checks to pass before merging:
  - `check` (typecheck/lint/test/build)
  - `gitleaks`
- Require conversation resolution before merging
- Require linear history
- Do NOT allow force pushes
- Do NOT allow deletions

Verify with:

```bash
gh api repos/marcelotust/copado26web/branches/main/protection | jq
```

## Required Actions secrets

| Secret | Used by |
| --- | --- |
| `POSTHOG_PERSONAL_API_KEY` | `posthog-metrics-check.yml`, future LLM analytics ingest |
| `POSTHOG_PROJECT_ID` | same |
| `SENTRY_AUTH_TOKEN` | `sentry-triage.yml` |
| `E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD`, `E2E_SUPABASE_SERVICE_ROLE_KEY` | `e2e-authenticated.yml` |

## Required Actions variables

| Variable | Default | Used by |
| --- | --- | --- |
| `POSTHOG_HOST` | `https://us.posthog.com` | `posthog-metrics-check.yml` |
