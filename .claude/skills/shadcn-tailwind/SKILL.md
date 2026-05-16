---
name: shadcn-tailwind
description: Use when implementing or auditing UI with shadcn-style components, Tailwind utility composition, and design tokens.
metadata:
  author: copado26web
  version: 1.0.0
---

# shadcn + Tailwind

Use this skill when the work touches component composition, Tailwind utility usage, or design-token discipline.

## Read first

- `AGENTS.md`
- `ai/agents/frontend-product-engineer.md`
- Existing components in `src/components/`
- `src/index.css`

## Rules

- Reuse existing UI components before writing custom markup.
- Keep styling semantic and consistent with the current design system.
- Prefer `gap-*`, `size-*`, and component variants over ad hoc spacing or manual sizing.
- Avoid raw color scales when semantic tokens already exist.
- Keep component APIs small and composable.
- Use existing button, card, input, dialog, tabs, badge, and separator patterns before inventing new ones.

## Typical checks

- Should this be a shared primitive or a page-level wrapper?
- Does the component already exist in the repo?
- Are states represented with proper variants instead of boolean prop sprawl?
- Is the layout resilient at mobile and desktop widths?

## Verification

- `npm run lint`
- `npm run test:ci`
- Browser/screenshot verification for visible UI changes

