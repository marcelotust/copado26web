#!/usr/bin/env bash
set -e

output="$(npm run --silent ai:harness 2>&1 || true)"
echo "[ai-harness post-edit] $(echo "$output" | grep -E 'Recommended gates|file groups|Manual checks' -A 20 | head -40)" >&2
exit 0
