#!/usr/bin/env bash
# scripts/session-brief.sh
#
# Emits a tight situational-awareness brief at the start of every Claude
# Code session. Wired into .claude/settings.json as a SessionStart hook.
#
# Goal: Claude never starts a session blind. Git state, recent commits,
# verify-data result, Phase 3 task posture, and sample-gate state all
# land in context before the first prompt.
#
# Fail-safe: every external call is wrapped so a missing network or a
# detached HEAD never breaks the session.

set -uo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$ROOT" ]; then
  echo "[session-brief] not in a git repo"
  exit 0
fi
cd "$ROOT"

# 5-second cap on fetch so offline sandboxes don't stall the hook.
timeout 5 git fetch --quiet --all 2>/dev/null || true

BRANCH="$(git symbolic-ref --short HEAD 2>/dev/null || echo '(detached)')"
HEAD_LINE="$(git log -1 --oneline --no-decorate 2>/dev/null || echo '(no commits)')"

# Local-vs-remote drift for the current branch.
BRANCH_DRIFT=""
if git rev-parse --quiet --verify "origin/$BRANCH" >/dev/null 2>&1; then
  AHEAD="$(git rev-list --count "origin/$BRANCH..HEAD" 2>/dev/null || echo '?')"
  BEHIND="$(git rev-list --count "HEAD..origin/$BRANCH" 2>/dev/null || echo '?')"
  if [ "$AHEAD" = "0" ] && [ "$BEHIND" = "0" ]; then
    BRANCH_DRIFT="in sync with origin"
  else
    BRANCH_DRIFT="${AHEAD} ahead / ${BEHIND} behind origin"
  fi
else
  BRANCH_DRIFT="(no remote tracking)"
fi

# Drift versus origin/main.
MAIN_DRIFT=""
if git rev-parse --quiet --verify origin/main >/dev/null 2>&1; then
  A="$(git rev-list --count "origin/main..HEAD" 2>/dev/null || echo '?')"
  B="$(git rev-list --count "HEAD..origin/main" 2>/dev/null || echo '?')"
  MAIN_DRIFT="${A} ahead / ${B} behind"
fi

# verify-data: capture the last line so any failure is visible.
VERIFY_LINE="$(node scripts/verify-data.js 2>&1 | tail -1 | head -c 240)"

# Phase 3 task counts parsed from the checklist (rough but useful).
P3_COMPLETE="$(grep -c '^| P3-.* | Complete ' docs/phase-3-execution-checklist.md 2>/dev/null || echo 0)"
P3_TODO="$(grep -c '^| P3-.* | Not started ' docs/phase-3-execution-checklist.md 2>/dev/null || echo 0)"
P3_GATED="$(grep -c '^| P3-.* | Needs user approval ' docs/phase-3-execution-checklist.md 2>/dev/null || echo 0)"

# Sample-gate presence (production paths must stay absent until real data).
present_or_absent() {
  if [ -f "public/$1" ]; then echo "PRESENT"; else echo "absent"; fi
}

cat <<EOF
─── FusionMetrics session brief ─────────────────────────────────────
Branch:   $BRANCH ($BRANCH_DRIFT)
HEAD:     $HEAD_LINE
vs main:  $MAIN_DRIFT
verify:   $VERIFY_LINE

Recent commits:
$(git log -5 --oneline --no-decorate 2>/dev/null | sed 's/^/  /')

Phase 3: $P3_COMPLETE complete · $P3_TODO not-started · $P3_GATED operator-only

Sample-gate (production filenames must stay 'absent'):
  premiumMetadata.json        $(present_or_absent premiumMetadata.json)
  ebayCompsSummary.json       $(present_or_absent ebayCompsSummary.json)
  premiumMetadata.sample.json $(present_or_absent premiumMetadata.sample.json)
  ebayCompsSummary.sample.json $(present_or_absent ebayCompsSummary.sample.json)

Trust contract: read AGENTS.md and CLAUDE.md § 7.1 before any change.
─── End brief ───────────────────────────────────────────────────────
EOF
