# Agent Personas

These personas are repo-specific prompts for repeatable AI-assisted workflows. They are
tool-agnostic: paste one into Codex/Claude/Cursor, or mirror it into a tool-specific agent system.

Use agents for bounded side work: investigation, review, QA, product sharpening, or isolated
implementation. Do not use them to replace the spec, tests, or final integration review.

## Personas

| Persona | Use when |
| --- | --- |
| `product-spec-writer.md` | Turning an idea into a spec with acceptance criteria and non-goals. |
| `frontend-product-engineer.md` | Implementing React UI while preserving app patterns and mobile behavior. |
| `supabase-security-reviewer.md` | Reviewing migrations, RLS, RPCs, auth, redirects, and data exposure. |
| `telemetry-privacy-reviewer.md` | Checking analytics, consent, logging, Sentry, and PostHog/Vercel event shape. |
| `qa-release-reviewer.md` | Selecting tests, running smoke checks, and finding release regressions. |
| `repo-architect.md` | Mapping codebase impact and preventing architecture drift. |

## Stack Guides

- [Stack Agent Map](./stack-map.md)
- [Stack x Agent Matrix](./stack-matrix.md)

## Output Contract

Every persona should return:

- Decision or recommendation.
- Evidence with file paths and relevant symbols.
- Risks or assumptions.
- Suggested verification commands.
- Files changed, if the persona implemented anything.

## Tool-Specific Adapters

These personas are the source of truth. When you need native tool support, wire them through thin adapters instead of maintaining separate prompt trees:

- Claude Code project memory: `CLAUDE.md`
- Claude Code native subagents: `.claude/agents/*.md`
- Claude Code slash commands: `.claude/commands/*.md`
- Claude Code project skills: `.claude/skills/*.md`
- Cursor project rules: `.cursor/rules/00-project.mdc`
- OpenCode instructions: `opencode.json`

Use the native adapters for tool loading, but keep the canonical persona text here so the behavior stays aligned across tools.
