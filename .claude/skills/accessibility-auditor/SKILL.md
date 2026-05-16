---
name: accessibility-auditor
description: Use when reviewing or building UI that must meet keyboard, screen-reader, and WCAG expectations.
metadata:
  author: copado26web
  version: 1.0.0
---

# Accessibility Auditor

Use this skill for WCAG-minded review of user-facing UI in the app.

## Read first

- `AGENTS.md`
- `ai/agents/frontend-product-engineer.md`
- `ai/agents/stack-map.md`
- Relevant UI files and tests

## Rules

- Every interactive control needs a clear accessible name.
- Dialogs, menus, tabs, and overlays need the expected focus and keyboard behavior.
- Color must not be the only signal for state.
- Keep text and controls readable at mobile sizes.
- Verify focus order, escape behavior, and empty/error states.
- Do not add visible helper text that explains implementation details.

## Audit questions

- Can the page be used entirely by keyboard?
- Does each control expose the right semantics?
- Are labels, hints, and errors tied to inputs correctly?
- Does the UI still work in reduced-motion and narrow-width scenarios?

## Verification

- Browser keyboard walk-through
- `npm run test:ci`
- Playwright smoke or screenshot validation for visible changes
