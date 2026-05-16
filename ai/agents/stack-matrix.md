# Stack x Agent Matrix

Use this matrix when deciding which persona or verification path to use for a change in this repository.

## React / Vite

| Change type | Use this agent | Notes |
| --- | --- | --- |
| New page, modal, sidebar, tabs, or form flow | `frontend-product-engineer` | Keep copy localized and preserve existing app patterns. |
| Visual refactor with responsive risk | `frontend-product-engineer` + `qa-release-reviewer` | Add browser-level proof when layout or interaction shifts. |
| Shared component or hook changes | `repo-architect` first, then `frontend-product-engineer` | Map blast radius before editing. |

## Supabase

| Change type | Use this agent | Notes |
| --- | --- | --- |
| Migration, policy, grants, RPC, or auth flow | `supabase-security-reviewer` | Review RLS, `SECURITY DEFINER`, `search_path`, and rollback notes. |
| Guest/public flow or placeholder env handling | `supabase-security-reviewer` + `frontend-product-engineer` | Verify anon-safe browser code and public E2E compatibility. |
| Schema or data model shape debate | `repo-architect` + `supabase-security-reviewer` | Separate architecture from enforcement details. |

## Sentry

| Change type | Use this agent | Notes |
| --- | --- | --- |
| New error reporting, tracing, or release health setup | `telemetry-privacy-reviewer` | Verify payload size, redaction, and consent boundaries. |
| Investigating a crash or regression from telemetry | `telemetry-privacy-reviewer` + `qa-release-reviewer` | Keep the loop tight: reproduce, inspect, verify fix. |

## PostHog

| Change type | Use this agent | Notes |
| --- | --- | --- |
| Add or change custom events | `telemetry-privacy-reviewer` | Check consent, taxonomy, and PII minimization. |
| Funnel, activation, retention, or lifecycle work | `product-spec-writer` + `telemetry-privacy-reviewer` | Tie the event plan back to the product doc. |
| Dashboard or experiment driven release | `qa-release-reviewer` | Confirm success metrics and proof plan before shipping. |

## Cross-Cutting Changes

| Change type | Use this agent | Notes |
| --- | --- | --- |
| New feature with ambiguity | `product-spec-writer` | Create the spec before coding. |
| Multi-module change | `repo-architect` | Identify boundaries and follow-on work first. |
| Release candidate or risky fix | `qa-release-reviewer` | Choose the smallest reliable test set. |
| Analytics plus UI plus backend | `repo-architect` -> `frontend-product-engineer` -> `supabase-security-reviewer` -> `telemetry-privacy-reviewer` | Order matters: scope, implement, secure, then measure. |

## Default Verification

| Area touched | Minimum gate |
| --- | --- |
| `src/**/*.ts` or `src/**/*.tsx` | `npm run lint`, `npm run typecheck`, `npm run test:ci` |
| UI or routing | relevant Playwright path, usually `npm run test:e2e:public` |
| `supabase/migrations/*.sql` | manual RLS/grants/security review plus migration-specific checks |
| `scripts/*.mjs` | `node --check <file>` |
| `package.json` or build surface | `npm run build` |

## How To Use This In Chat

- Run `npm run ai:harness` on your diff — it prints **Recommended personas** with paths and Claude slash commands.
- If the request is unclear, ask the `product-spec-writer` to shape it first.
- If the request is clearly scoped, call the most specific agent directly.
- If the change crosses boundaries, ask `repo-architect` before any code edit.
- If the change affects both behavior and data, keep `supabase-security-reviewer` in the loop before merge.

