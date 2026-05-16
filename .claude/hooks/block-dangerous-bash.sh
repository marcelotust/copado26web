#!/usr/bin/env bash
set -euo pipefail

input="$(cat)"
cmd="$(echo "$input" | jq -r '.tool_input.command // empty')"

reject() {
  echo "Blocked by repo policy: $1" >&2
  echo "Override only with explicit user authorization; see AGENTS.md > Agent Safety." >&2
  exit 2
}

branch="$(git symbolic-ref --short HEAD 2>/dev/null || echo '')"

case "$cmd" in
  *--no-verify*) reject "--no-verify bypasses required pre-push gates" ;;
  *--no-gpg-sign*) reject "--no-gpg-sign bypasses commit signing" ;;
  *"git push --force"*|*"git push -f "*|*"git push -f"*|*"--force-with-lease"*) reject "force push" ;;
  *"git reset --hard origin/main"*) reject "destructive reset against origin/main" ;;
  *"git push --delete main"*|*"git push --delete master"*) reject "deleting protected branch" ;;
  *"rm -rf /"*|*"rm -rf ~"*) reject "destructive filesystem delete" ;;
esac

if [[ "$cmd" == *"git commit"* ]] && [[ "$branch" == "main" || "$branch" == "master" ]]; then
  reject "direct commit to $branch is not allowed"
fi

if [[ "$cmd" == *"git push"* ]] && [[ "$cmd" == *" main"* || "$cmd" == *" master"* || "$cmd" == *":main"* || "$cmd" == *":master"* ]] && [[ "$branch" != "main" && "$branch" != "master" ]]; then
  reject "pushing to main/master from $branch is not allowed"
fi

exit 0
