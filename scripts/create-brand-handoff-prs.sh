#!/usr/bin/env bash
# Split brand handoff work into two PRs: #163 (tokens) then #162 (assets).
# Excludes docs/supabase-production-security.md (unrelated).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DOC_STASHED=0
if git diff --quiet -- docs/supabase-production-security.md 2>/dev/null; then
  :
else
  git stash push -m "exclude: supabase-production-security.md" -- docs/supabase-production-security.md
  DOC_STASHED=1
fi

git fetch origin
git checkout main
git pull origin main

# --- PR #163: design tokens ---
git checkout -b feat/163-design-tokens

git add \
  src/styles/tokens.css \
  src/styles/tokens.ts \
  src/styles/tokens.test.ts \
  tailwind.config.js \
  src/index.css

git commit -m "$(cat <<'EOF'
feat(brand): add design tokens and Tailwind palette (#163)

EOF
)"

git stash push -u -m "brand-162 asset pack (wip)"

git push -u origin feat/163-design-tokens

PR163_URL="$(gh pr create \
  --title "feat(brand): design tokens + Tailwind palette" \
  --body "$(cat <<'EOF'
## Summary
- Add Palette A CSS variables (`src/styles/tokens.css`) and typed exports (`src/styles/tokens.ts`).
- Wire tokens into Tailwind (`tailwind.config.js`) and foil utilities in `src/index.css`.
- Add Vitest coverage for locked hex values.

Closes #163

## Test plan
- [ ] `npm run typecheck`
- [ ] `npm run test:ci` (includes `src/styles/tokens.test.ts`)
- [ ] `npm run build`
- [ ] `npm run ai:harness`
EOF
)" --head feat/163-design-tokens --base main)"

echo "PR #163: $PR163_URL"

# --- PR #162: brand asset pack ---
git checkout main
git checkout -b feat/162-brand-asset-pack
git stash pop

git add \
  public/ \
  scripts/export-brand-pack.mjs \
  scripts/brand-export/ \
  scripts/create-brand-handoff-prs.sh \
  package.json \
  package-lock.json \
  ai/specs/2026-05-18-brand-handoff/

git commit -m "$(cat <<'EOF'
feat(brand): export brand asset pack to public/ (#162)

EOF
)"

git push -u origin feat/162-brand-asset-pack

PR162_URL="$(gh pr create \
  --title "feat(brand): brand asset pack export" \
  --body "$(cat <<'EOF'
## Summary
- Add `npm run brand:export` (`scripts/export-brand-pack.mjs`, `scripts/brand-export/`) with Playwright + `qrcode` devDependency.
- Commit generated brand assets under `public/` (logos, favicons, PWA/Chrome icons, OG, splash, email seal).
- Include `ai/specs/2026-05-18-brand-handoff/` handoff spec context.

Closes #162

## Test plan
- [ ] `npm run brand:export`
- [ ] `npm run build`
- [ ] Spot-check favicon / PWA icons in browser devtools
- [ ] `npm run ai:harness`
EOF
)" --head feat/162-brand-asset-pack --base main)"

echo "PR #162: $PR162_URL"

if [[ "$DOC_STASHED" == "1" ]]; then
  git stash pop || true
fi

echo ""
echo "Done."
echo "  #163: $PR163_URL"
echo "  #162: $PR162_URL"
