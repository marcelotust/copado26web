---
name: react-best-practices
description: Use when building or reviewing React/Vite code that affects rendering, data flow, or performance.
metadata:
  author: copado26web
  version: 1.0.0
---

# React Best Practices

Use this skill for React, Vite, hooks, state, rendering, and bundle-sensitive work in `Meu Album 2026`.

## Read first

- `AGENTS.md`
- `ai/agents/frontend-product-engineer.md`
- `ai/agents/repo-architect.md`
- Nearby source and tests

## Rules

- Prefer existing components, hooks, selectors, and telemetry helpers.
- Keep derived values in render unless you need synchronization with an external system.
- Avoid unnecessary abstraction, memoization, or callback wrappers unless the repo already uses them for the same problem.
- Keep guest/public flows working with placeholder Supabase values.
- Put user-facing copy in i18n files, not inline strings.

## Check before changing

- Can the change stay inside one component or hook?
- Is state local enough, or should it move to the existing store/provider?
- Does the change affect rendering cost, reactivity, or bundle size?
- Do tests already cover the behavior nearby?

## Verification

- `npm run lint`
- `npm run typecheck`
- `npm run test:ci`
- `npm run build` when the change touches the build surface

