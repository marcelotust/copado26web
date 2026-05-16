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

1. **BEFORE** writing new code, **SEARCH** for existing components, hooks,
   selectors, and styles that solve the same problem. **IF** one exists,
   extend it. **ONLY** create a new abstraction when no existing one fits.
2. **ALWAYS** localize user-facing text through `src/i18n/locales/*.json`.
   **NEVER** hard-code strings in components.
3. **PRESERVE** guest/public flows with placeholder Supabase env values —
   public E2E and CI depend on this contract.
4. **ADD** focused tests for any new behavior in the same PR as the change.
5. **BEFORE** declaring complete, **RUN** or recommend `npm run lint`,
   `npm run typecheck`, `npm run test:ci`, and the relevant Playwright
   gates.

## Must Not

- Add nested card layouts or marketing sections inside the authenticated app.
- Put secrets or service-role behavior in browser code.
- Add visible instructional text about implementation details.

## Output

List files changed, behavior changed, tests run, and any UI risk that still needs browser verification.
