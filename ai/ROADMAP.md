# AI Workflow Roadmap

Deferred improvements to the AI-assisted dev workflow. Each item lists a **retake trigger** — a concrete signal that says "now is the time". The roadmap is not a calendar; we pull items when a trigger fires, not on a date.

## Active

Tracked in PRs:

_(none — v2 enforcement and v3 agent telemetry landed on `main`; see git history and `docs/claude-code-llm-analytics.md`.)_

## Deferred

### LLM analytics persona property

**What:** tag Claude Code sessions with `persona` (or `$ai_metadata.persona`) when invoking `ai/agents/*` commands, via `POSTHOG_LLMA_CUSTOM_PROPERTIES` or plugin conventions.

**Retake trigger:** first HogQL review of `$ai_generation` events shows no reliable persona dimension.

**Why deferred:** verify what the PostHog plugin captures after v3 ingest is live; extend only if missing.

### Bundle size budget

**What:** add `size-limit` or `bundlewatch` to `check.yml` with a per-chunk kB budget. Today `npm run build` passes regardless of bundle growth, so PWA cold start degrades silently.

**Retake trigger:** first complaint about cold start latency, or `dist/assets/index-*.js` crosses 500 kB gzipped.

**Why deferred:** baseline must be measured first; gate without baseline is theatre.

### Supabase migration linter

**What:** `scripts/supabase-migration-lint.mjs` flagging common foot-guns — `SECURITY DEFINER` without `set search_path`, new tables without RLS, `grant ... to anon/authenticated` on tables with RLS disabled.

**Retake trigger:** second incident traced back to a missed migration safety rule. Once is bad luck; twice is a pattern that automation pays for.

**Why deferred:** `supabase-security-reviewer` persona + manual review on `supabase/migrations/*` already cover this for the current cadence of migrations.

### Spec Definition-of-Ready linter

**What:** `scripts/spec-lint.mjs` failing CI if a spec under `ai/specs/<active-slug>/` still contains `<feature-name>` placeholders, empty acceptance criteria, or unfilled privacy/telemetry sections.

**Retake trigger:** second spec landed half-filled.

**Why deferred:** team is small; social enforcement still works.

### `--iterate` mode in `ai-harness`

**What:** when `npm run ai:harness -- --run` fails, capture stderr and emit a structured error doc the next agent invocation can consume to self-correct.

**Retake trigger:** rolling 3 PRs where the agent had to be re-prompted manually with failure output. That is the moment automation pays for itself.

**Why deferred:** current agent loops are short enough to handle by hand.

### Agent eval harness

**What:** small golden set of tasks (`given this PR description, draft a spec`; `given this migration, flag RLS risks`) run periodically against each persona to detect drift in agent behavior.

**Retake trigger:** any persona output noticeably regresses across sessions, or a new model is adopted.

**Why deferred:** evals only matter when there is a model swap or measurable regression to defend against.

### Codeowners for `ai/agents/` and `AGENTS.md`

**What:** `.github/CODEOWNERS` requiring explicit review for changes to the operating contract, personas, and harness rules.

**Retake trigger:** more than one human contributor regularly editing these files.

**Why deferred:** solo maintainer today.

### "Don't read" hints for agents

**What:** explicit list of paths agents should not read into context (`supabase/.temp/`, large fixture JSONs, generated types) to save token budget and reduce stale-context bugs.

**Retake trigger:** an agent makes a decision based on a generated or temp file.

**Why deferred:** no concrete incident yet.

## Principle

We resist building tooling ahead of pain. Each deferred item lists the pain that justifies it. When pain shows up, the work is small and obvious. When it does not, the tooling is overhead.
