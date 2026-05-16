#!/usr/bin/env bash
# Shared helpers for repo AI agent hooks (Claude Code, Cursor, Codex).
# Sourced by adapters; do not execute directly.

reject_git_policy() {
  local reason="$1"
  echo "Blocked by repo policy: $reason" >&2
  echo "Override only with explicit user authorization; see AGENTS.md > Agent Safety." >&2
  if [[ "${HOOK_RUNTIME:-}" == "cursor" ]]; then
    local msg="Blocked: ${reason}. See AGENTS.md > Agent Safety."
    printf '%s\n' "{\"permission\":\"deny\",\"user_message\":\"${msg}\",\"agent_message\":\"${msg}\"}"
  fi
  return 2
}

extract_shell_command() {
  local input="$1"
  echo "$input" | jq -r '
    .tool_input.command //
    .command //
    .tool_call.command //
    empty
  ' 2>/dev/null || true
}

detect_hook_runtime() {
  local input="$1"
  if [[ -n "${HOOK_RUNTIME:-}" ]]; then
    return 0
  fi
  if echo "$input" | jq -e 'has("command") and ((.tool_input.command // "") == "")' >/dev/null 2>&1; then
    HOOK_RUNTIME=cursor
  else
    HOOK_RUNTIME=claude
  fi
}

check_dangerous_git_command() {
  local cmd="$1"
  local branch
  branch="$(git symbolic-ref --short HEAD 2>/dev/null || echo '')"

  case "$cmd" in
    *--no-verify*) reject_git_policy "--no-verify bypasses required pre-push gates" ;;
    *--no-gpg-sign*) reject_git_policy "--no-gpg-sign bypasses commit signing" ;;
    *"git push --force"*|*"git push -f "*|*"git push -f"*|*"--force-with-lease"*) reject_git_policy "force push" ;;
    *"git reset --hard origin/main"*) reject_git_policy "destructive reset against origin/main" ;;
    *"git push --delete main"*|*"git push --delete master"*) reject_git_policy "deleting protected branch" ;;
    *"rm -rf /"*|*"rm -rf ~"*) reject_git_policy "destructive filesystem delete" ;;
  esac

  if [[ "$cmd" == *"git commit"* ]] && [[ "$branch" == "main" || "$branch" == "master" ]]; then
    reject_git_policy "direct commit to $branch is not allowed"
  fi

  if [[ "$cmd" == *"git push"* ]] && [[ "$cmd" == *" main"* || "$cmd" == *" master"* || "$cmd" == *":main"* || "$cmd" == *":master"* ]] && [[ "$branch" != "main" && "$branch" != "master" ]]; then
    reject_git_policy "pushing to main/master from $branch is not allowed"
  fi

  return 0
}

run_post_edit_harness_hint() {
  local output
  output="$(npm run --silent ai:harness 2>&1 || true)"
  echo "[ai-harness post-edit] $(echo "$output" | grep -E 'Recommended gates|Recommended personas|file groups|Manual checks' -A 20 | head -50)" >&2
}

should_run_stop_harness() {
  ! git diff --quiet || return 0
  ! git diff --cached --quiet || return 0
  [[ -n "$(git ls-files --others --exclude-standard)" ]]
}
