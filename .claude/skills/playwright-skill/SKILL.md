---
name: playwright-skill
description: Use when building, debugging, or verifying browser flows with Playwright.
metadata:
  author: copado26web
  version: 1.0.0
---

# Playwright

Use this skill for routing, guest/public flows, auth flows, screenshot checks, and regression verification.

## Read first

- `AGENTS.md`
- `docs/e2e.md`
- `ai/agents/qa-release-reviewer.md`
- Relevant `e2e/` specs

## Rules

- Prefer the smallest test that proves the user-visible behavior.
- Update the nearest Playwright project: `public`, `setup`, or `authenticated`.
- Keep fixtures and selectors stable.
- Use browser checks for anything visual, interactive, or route-sensitive.
- Validate login, guest, and placeholder Supabase paths when they are part of the flow.

## Typical workflows

- New public flow: update `e2e/public`
- Auth setup or stateful flow: update `e2e/setup` and `e2e/authenticated`
- Visual regression: capture a screenshot and compare layout at the relevant viewport
- Flaky failure: reproduce once locally before changing selectors or timings

## Verification

- `npm run test:e2e:public`
- `npm run test:e2e:auth` when authenticated paths are involved
- `npm run test:ci` for behavior-level regressions

