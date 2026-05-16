#!/usr/bin/env bash
set -euo pipefail

HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=../lib.sh
source "$HOOK_DIR/../lib.sh"

input="$(cat)"
detect_hook_runtime "$input"

cmd="$(extract_shell_command "$input")"
[[ -z "$cmd" ]] && exit 0

check_dangerous_git_command "$cmd"
