# AI-Assisted Development Harness

This directory is the repo-local operating layer for spec-driven and AI-assisted development.
It keeps reusable prompts, specs, and verification policy in version control instead of leaving
them scattered across chat histories.

## Why This Shape

The current state of the art has converged on a few practical patterns:

- Spec-first artifacts give coding agents structured context before code changes.
- Small, task-specific agents are useful for bounded research, QA, security, and review work.
- A deterministic local harness should choose and run checks instead of asking the model to guess.
- Repo memory should be short, explicit, and versioned; long-lived decisions belong in docs or specs.
- Orientation alone is not enough — enforcement lives in git hooks, CI status checks,
  CODEOWNERS, and (for Claude Code) `PreToolUse`/`PostToolUse`/`Stop` hooks that auto-run
  the harness and refuse dangerous commands.

External references that informed this setup:

- GitHub Spec Kit: https://github.github.com/spec-kit/
- OpenAI Codex use cases: https://developers.openai.com/codex/use-cases
- OpenAI Codex overview: https://help.openai.com/en/articles/11369540/
- Claude Code subagents: https://code.claude.com/docs/en/sub-agents

## Directory Map

| Path | Purpose |
| --- | --- |
| `AGENTS.md` | Repo-wide operating contract: Product Boundaries, **Agent Safety**, **Definition of Done**, AI Workflow, testing rules. |
| `ai/CONVENTIONS.md` | Branch, commit, PR, and file naming rules. |
| `ai/ROADMAP.md` | Deferred workflow improvements and their retake triggers. |
| `ai/specs/` | Feature specs, plans, tasks, and verification notes. |
| `ai/specs/_template/` | Copyable templates for new spec-driven work. |
| `ai/agents/` | Tool-agnostic personas (imperative form) for repeated agent workflows. |
| `ai/agents/stack-map.md` | Canonical agent map for this stack. |
| `ai/agents/stack-matrix.md` | Decision matrix for choosing the right agent by change type. |
| `.cursor/rules/` | Cursor adapter — `00-project.mdc` imports canonical docs, `10-*` to `14-*` are glob-scoped safety rules. |
| `.claude/agents/` · `.claude/commands/` · `.claude/skills/` | Claude Code adapters that mirror the canonical personas. |
| `.claude/hooks/` | Claude Code `PreToolUse` / `PostToolUse` / `Stop` hooks that auto-run the harness and refuse dangerous git operations. |
| `.claude/settings.json` | Hook config (shared); per-dev config lives in gitignored `.claude/settings.local.json`. |
| `scripts/ai-harness.mjs` | Local changed-file classifier and quality gate runner. |
| `.husky/pre-commit` · `.husky/pre-push` | Local git guards: lint-staged + branch guard on commit, lint + harness + force-push guard on push. |
| `.github/CODEOWNERS` | Owner review required for changes to `AGENTS.md`, personas, harness, workflows, husky, `.claude/`. |
| `.github/workflows/gitleaks.yml` | Required CI gate scanning every PR diff for committed secrets. |
| `.github/pull_request_template.md` | Canonical PR body shape mirrored from `ai/CONVENTIONS.md`. |
| `docs/repo-setup.md` | GitHub-side settings (branch protection, required secrets) — owner-applied. |
| `docs/claude-code-llm-analytics.md` | Capture Claude Code CLI sessions in PostHog LLM Analytics. |

## Default Workflow

For a small bug fix:

1. Read the relevant code and tests.
2. Make the smallest coherent change.
3. Run `npm run ai:harness`.
4. Run the gates it recommends.

For a feature or ambiguous product change:

1. Create `ai/specs/YYYY-MM-DD-short-slug/`.
2. Copy `spec.md`, `plan.md`, `tasks.md`, and `verification.md` from `ai/specs/_template/`.
3. Fill the spec before coding; keep open questions visible.
4. Implement one task slice at a time.
5. Update verification notes with commands, screenshots, or manual checks.

For production-risk work:

1. Use the relevant persona from `ai/agents/`.
2. Require file references and explicit risks in the agent output.
3. Run `npm run ai:harness -- --run` when the local environment can support the selected gates.

## Repo-Specific Policy

- Do not include PII or secrets in prompts, telemetry, logs, specs, or screenshots.
- Treat `docs/mvp-quality-and-observability.md`, `docs/e2e.md`, and `docs/supabase-production-security.md` as required context for related changes.
- Keep scanner/OCR out of MVP work unless a spec explicitly brings it back into scope.
- Prefer updating existing tests over creating broad, slow suites.
