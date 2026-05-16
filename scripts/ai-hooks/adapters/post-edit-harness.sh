#!/usr/bin/env bash
set -euo pipefail

HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=../lib.sh
source "$HOOK_DIR/../lib.sh"

# Consume stdin so callers can pass tool-specific JSON without errors.
cat >/dev/null

run_post_edit_harness_hint
exit 0
