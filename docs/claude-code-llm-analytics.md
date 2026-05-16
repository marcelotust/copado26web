# Claude Code → PostHog LLM Analytics

Capture [Claude Code](https://docs.anthropic.com/en/docs/claude-code/overview) sessions as `$ai_generation`, `$ai_span`, and `$ai_trace` events so we can measure agent workflow usage (personas, gates, token cost).

**Project choice (issue #149):** **Option A** — same PostHog project as product analytics (`POSTHOG_PROJECT_ID=424957`, `VITE_POSTHOG_KEY` in Vercel). Agent sessions share the project with end-user events; use privacy mode and filters in dashboards to separate them.

Product browser telemetry stays in `src/lib/telemetry/posthog.ts` (consent-gated). Claude Code ingestion is separate: CLI plugin + env vars, never bundled in the app.

---

## 1. Install the PostHog plugin (once per machine)

```bash
claude plugin install posthog
```

This registers a `SessionEnd` hook that sends events when each Claude Code session ends.

---

## 2. Configure env (per developer)

Use the **same** `phc_*` project API key as `VITE_POSTHOG_KEY` (Project Settings → Project API key). Do **not** use `POSTHOG_PERSONAL_API_KEY` here — that key is for HogQL/metrics scripts only.

### Recommended: `.claude/settings.local.json` (gitignored)

Create or merge into [`.claude/settings.local.json`](../.claude/settings.local.json):

```json
{
  "env": {
    "POSTHOG_LLMA_CC_ENABLED": "true",
    "POSTHOG_API_KEY": "<same phc_* key as VITE_POSTHOG_KEY>",
    "POSTHOG_HOST": "https://us.i.posthog.com",
    "POSTHOG_LLMA_PRIVACY_MODE": "true",
    "POSTHOG_LLMA_CUSTOM_PROPERTIES": "{\"ai_source\":\"claude-code\",\"repo\":\"copado26web\"}"
  }
}
```

| Variable | Purpose |
| --- | --- |
| `POSTHOG_LLMA_CC_ENABLED` | Must be `true` for automatic session capture |
| `POSTHOG_API_KEY` | Project API key (`phc_*`) |
| `POSTHOG_HOST` | Ingest host (`https://us.i.posthog.com` or EU) |
| `POSTHOG_LLMA_PRIVACY_MODE` | `true` = no prompt/tool content in PostHog (tokens/costs still captured) — **recommended** with Option A |
| `POSTHOG_LLMA_CUSTOM_PROPERTIES` | JSON tags on every event (filter LLM analytics vs product events) |

Optional: `POSTHOG_LLMA_DISTINCT_ID`, `POSTHOG_LLMA_TRACE_GROUPING` (`session` \| `message`). See [PostHog docs](https://posthog.com/docs/llm-analytics/installation/claude-code).

### Alternative: shell profile

```bash
export POSTHOG_LLMA_CC_ENABLED=true
export POSTHOG_API_KEY="phc_..."
export POSTHOG_HOST="https://us.i.posthog.com"
export POSTHOG_LLMA_PRIVACY_MODE=true
```

---

## 3. Verify

**Inside Claude Code** after a session:

```
/posthog:llma-cc-status
```

**From the repo:**

```bash
npm run posthog:llm-check-env    # env + plugin path (no network)
npm run posthog:llm-status       # last hook send (~/.claude/posthog-llma-status.json)
npm run posthog:llm-ingest       # manual ingest of latest session for this cwd
npm run posthog:llm-ingest -- --list
```

In PostHog: [LLM analytics](https://us.posthog.com/llm-analytics) → filter e.g. `ai_source = claude-code` if you set `POSTHOG_LLMA_CUSTOM_PROPERTIES`.

HogQL sanity check (needs `POSTHOG_PERSONAL_API_KEY` + `POSTHOG_PROJECT_ID=424957`):

```sql
SELECT event, count() FROM events
WHERE event IN ('$ai_generation', '$ai_span', '$ai_trace')
  AND timestamp > now() - INTERVAL 1 DAY
GROUP BY event
```

---

## 4. Manual ingest (past sessions)

If sessions ran before the plugin was enabled:

```bash
npm run posthog:llm-ingest -- <session-id>
# or
/posthog:llma-cc-ingest
```

The npm script wraps `llma_cc_ingest.py` from the installed PostHog plugin and reads `POSTHOG_API_KEY` from the environment or `.env.local` (`VITE_POSTHOG_KEY`).

---

## Env var cheat sheet

| Variable | Used by | Notes |
| --- | --- | --- |
| `POSTHOG_API_KEY` | Claude Code plugin, `posthog:llm-ingest` | Project key `phc_*` |
| `POSTHOG_HOST` | Plugin / ingest | Ingest URL (`us.i.posthog.com`) |
| `POSTHOG_LLMA_CC_ENABLED` | Plugin auto-hook | `true` to enable |
| `POSTHOG_PERSONAL_API_KEY` | `posthog:metrics-check` | Personal key, Query Read |
| `POSTHOG_PROJECT_ID` | `posthog:metrics-check` | `424957` for this repo |
| `VITE_POSTHOG_KEY` | Browser app | Same `phc_*` as above; not read by Claude Code |

---

## Risks (Option A)

- **Dashboard noise:** filter LLM analytics by `ai_source` or custom properties; product funnels stay on `posthog-js` events.
- **Sensitive content:** with `POSTHOG_LLMA_PRIVACY_MODE=false`, tool results can include repo source. Default to privacy mode unless debugging a specific session.
- **Retention:** same project retention/access as product data.

---

## Follow-ups

- **Persona tagging:** if `$ai_metadata.persona` is missing after first ingest, add a convention in `ai/agents/` and extend `POSTHOG_LLMA_CUSTOM_PROPERTIES` (see `ai/ROADMAP.md`).
- **Dashboards:** build once data is flowing (out of scope for #149).

See also: [setup-sentry-posthog.md](./setup-sentry-posthog.md), [metricas/README.md](./metricas/README.md).
