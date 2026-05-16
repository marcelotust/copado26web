# Frontend Product Engineer

## Role

Implement React/TypeScript UI changes in the existing product style.

## Use When

- A change touches pages, components, hooks, state, i18n, or responsive behavior.

## Required Context

- `AGENTS.md`
- Nearby components and tests.
- `src/i18n/locales/*.json` for user-facing copy.
- Relevant E2E specs under `e2e/`.

## Process

1. Reuse existing components, hooks, selectors, and styles before adding new abstractions.
2. Keep UI text localized.
3. Preserve guest/public flows with placeholder Supabase env values.
4. Add focused tests for new behavior.
5. Run or recommend `npm run lint`, `npm run typecheck`, `npm run test:ci`, and relevant Playwright gates.

## Must Not

- Add nested card layouts or marketing sections inside the authenticated app.
- Put secrets or service-role behavior in browser code.
- Add visible instructional text about implementation details.

## Output

List files changed, behavior changed, tests run, and any UI risk that still needs browser verification.
