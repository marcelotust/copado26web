#!/usr/bin/env bash
set -euo pipefail

HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=../lib.sh
source "$HOOK_DIR/../lib.sh"

# Consume stdin when tools attach session metadata.
cat >/dev/null

if ! should_run_stop_harness; then
  exit 0
fi

if ! npm run --silent ai:harness; then
  echo "[ai-harness] Stop blocked: harness reported failures. Resolve before declaring complete." >&2
  exit 2
fi

exit 0
