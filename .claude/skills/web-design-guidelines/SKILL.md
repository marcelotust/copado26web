---
name: web-design-guidelines
description: Use when reviewing or building user-facing UI, layouts, interaction states, and accessibility.
metadata:
  author: copado26web
  version: 1.0.0
---

# Web Design Guidelines

Use this skill for UI polish, layout structure, spacing, responsive behavior, and interaction states in the authenticated product.

## Read first

- `AGENTS.md`
- `ai/agents/frontend-product-engineer.md`
- `ai/agents/stack-map.md`
- Relevant page and component files

## Rules

- Match the existing app shell, tab navigation, sticker card patterns, and compact operational UI.
- Avoid marketing-style sections inside the authenticated app.
- Keep text localized and make sure labels fit their containers on mobile and desktop.
- Use icons, toggles, tabs, and menus where they are the familiar interaction pattern.
- Verify hover, focus, loading, empty, and error states.
- Prefer semantic color tokens and existing design primitives over one-off styling.

## Review questions

- Does the layout match the repo's mobile-first behavior?
- Is the hierarchy clear at a glance?
- Are keyboard and screen reader states usable?
- Are there any visual regressions at 320px, 768px, 1024px, and desktop widths?

## Verification

- Browser screenshot or Playwright check for meaningful UI changes
- `npm run test:e2e:public` when routing or public flows change
- `npm run test:ci` when behavior changed

