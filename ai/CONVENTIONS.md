# Conventions

Naming and structure conventions for branches, commits, PRs, and specs. Optimized for AI-assisted work: agents and humans should produce output that looks the same.

## Branches

`<type>/<short-kebab-slug>`. Keep slugs descriptive but under ~40 chars.

| Prefix | Use for |
| --- | --- |
| `feat/` | New user-visible behavior or capability. |
| `fix/` | Bug fix, no new behavior. |
| `chore/` | Infra, build, deps, tooling, repo housekeeping. |
| `refactor/` | Internal restructure, no behavior change. |
| `docs/` | Docs-only change. |
| `codex/`, `claude/`, `<agent>/` | Work originated by an AI agent in autonomous mode. |

Examples: `feat/ai-assisted-dev-workflow`, `fix/posthog-d7-hogql`, `chore/sentry-noise-reduction`.

## Commit Messages

Conventional Commits: `type(scope): subject`. Subject in lowercase, no trailing period, ≤ 72 chars.

```
feat(landing): ship mosaic hero with vignette text and CTA A/B routing
fix(metrics): read POSTHOG_HOST from repository variables
chore(ai): version .claude/ skills, agents, commands per-repo
```

Body explains the **why**, not the what. The diff already shows the what.

When an AI agent collaborated, add a trailer:

```
Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

## Pull Requests

### Title

Same shape as the commit message: `type(scope): subject`. Under 70 chars.

### Body

Use `.github/pull_request_template.md`. Required sections:

- **Summary** — 1-3 bullets focused on user/business impact, not file lists.
- **Spec** — link to `ai/specs/<slug>/` or write `N/A: narrow bug fix`.
- **Gates run** — paste the relevant lines from `npm run ai:harness` output, mark each pass/fail.
- **Manual checks** — list what was tested in the browser or against Supabase. Use `N/A` if not applicable.
- **Risks / rollout** — optional. Use when migration, feature flag, or auth boundary changes.

### Size and scope

- One coherent change per PR. If the diff covers two unrelated motivations, split it.
- Target ≤ 400 added lines for feature work. Bigger PRs need a spec.
- Refactor and behavior change in the same PR is a smell. Land the refactor first.

## Specs

Folder: `ai/specs/YYYY-MM-DD-short-slug/` from `ai/specs/_template/`.

Required when the task touches more than one of: routing, auth, paywall, onboarding, activation/retention metrics, Supabase schema, RLS, telemetry taxonomy, or i18n surface. Skip for narrow bug fixes with a clear test.

Definition of Ready before implementation: problem stated, non-goals listed, acceptance criteria testable, privacy/telemetry/i18n/migration impact marked, open questions explicit.

## File and Folder Names

- TypeScript files: kebab-case for modules (`use-onboarding.ts`), PascalCase for components (`OnboardingOverlay.tsx`).
- Test files: colocated with the unit, `<unit>.test.ts(x)`.
- Specs and docs: lowercase kebab-case markdown (`mvp-quality-and-observability.md`).
- i18n keys: dot-separated nouns, no free-form English (`dashboard.globalProgress`, not `dashboard.greeting_text`).

## Skipping a Gate

If `npm run ai:harness` recommends a gate you cannot run (no Supabase test env, no headless browser, etc.), record it in the PR body under **Gates run** with the blocker. Do not silently skip.
