# Stack Agent Map

This document is the repo's practical map of which agent persona to use for each kind of work in the React/Vite/Supabase/Sentry/PostHog stack.

It is intentionally narrow:

- Use the smallest agent that can answer the question.
- Keep the canonical persona text in `ai/agents/`.
- Keep tool-specific wrappers thin.
- Prefer vendor skills for platform-specific correctness when they exist.

## Canonical Personas

| Persona | Primary job | Best fit |
| --- | --- | --- |
| `product-spec-writer` | Turn product intent into a testable spec. | Ambiguous feature requests, scope debates, product/UX tradeoffs. |
| `frontend-product-engineer` | Implement React UI in the existing app style. | Pages, components, hooks, i18n, responsive behavior, client state. |
| `supabase-security-reviewer` | Review Supabase boundary and data exposure. | Migrations, RLS, RPCs, auth, redirects, guest flows, security review. |
| `telemetry-privacy-reviewer` | Review analytics and privacy. | PostHog events, Sentry payloads, consent flow, logging, LGPD checks. |
| `qa-release-reviewer` | Choose and run the smallest reliable verification set. | Release readiness, smoke checks, regression triage, test selection. |
| `repo-architect` | Map impact and keep boundaries clean. | Cross-cutting changes, refactors, coupling analysis, rollout sequencing. |

## External Skills Worth Mirroring

These are the vendor/community assets that are actually useful for this stack:

| Skill or agent | Why it matters |
| --- | --- |
| Supabase agent skills | Best source for database, auth, storage, realtime, migration, and RLS correctness. |
| `sentry-react-sdk` / `sentry-fix-issues` | Good for React/Vite setup, error triage, tracing, and issue-to-fix loops. |
| PostHog AI / PostHog setup flow | Helpful for instrumentation, funnel analysis, and product analytics setup. |

For this repo, the non-negotiable rule is that vendor skills can supplement the local personas, but they should not replace the repo's own constraints around RLS, privacy, and MVP scope.

## Suggested Call Pattern

1. Start with `repo-architect` when the change touches more than one area.
2. Use `product-spec-writer` when the request is still fuzzy.
3. Use `frontend-product-engineer` for UI implementation.
4. Use `supabase-security-reviewer` before any migration or data-flow merge.
5. Use `telemetry-privacy-reviewer` before shipping analytics or logging changes.
6. Use `qa-release-reviewer` to decide the minimum proof required.

## Tool Mapping

| Tool | Native entrypoint |
| --- | --- |
| Claude Code | `CLAUDE.md` plus `.claude/agents/*.md` |
| Cursor | `.cursor/rules/*.mdc` and `AGENTS.md` |
| OpenCode | `opencode.json` and `AGENTS.md` |
| Codex | `AGENTS.md` |

