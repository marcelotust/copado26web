#!/usr/bin/env bash
set -e

if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
  exit 0
fi

if ! npm run --silent ai:harness; then
  echo "[ai-harness] Stop blocked: harness reported failures. Resolve before declaring complete." >&2
  exit 2
fi

exit 0
