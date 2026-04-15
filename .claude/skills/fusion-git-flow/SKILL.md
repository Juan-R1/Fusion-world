---
name: fusion-git-flow
description: Git workflow for FusionMetrics — branch rules, commit format, push retry, non-fast-forward recovery. Use for any commit/push/rebase operation on this repo.
version: 1.0.0
category: Maintenance
triggers:
  - commit
  - push
  - rebase
  - non-fast-forward
  - branch
---

# FusionMetrics Git Flow

## The Branch
All work lives on: `claude/dbfw-market-analytics-1qh5D`
Never push to `main`. Never force-push anywhere.

## Commit format
```
<type>: <tab-or-area> <short summary>

- Bullet 1
- Bullet 2
- Bullet 3
```
Types: `feat` `fix` `chore` `docs` `refactor` `data`.
No emojis in commit subject. Body bullets describe *what changed*, not *how*.

## Standard push sequence
```bash
git add <explicit file paths>     # NEVER git add . or -A
git status                        # verify
git commit -m "feat: ..."
git push -u origin claude/dbfw-market-analytics-1qh5D
```

## Push retry policy
On network failure: retry up to 4 times with backoff 2s → 4s → 8s → 16s.
On non-fast-forward rejection: do NOT retry — run recovery.

## Non-fast-forward recovery
```bash
git fetch origin claude/dbfw-market-analytics-1qh5D
git rebase origin/claude/dbfw-market-analytics-1qh5D
# if "cannot rebase: unstaged changes":
git stash
git rebase origin/claude/dbfw-market-analytics-1qh5D
git stash pop
# resolve any conflicts, then:
git push origin HEAD:claude/dbfw-market-analytics-1qh5D
```

## Repo safety
- Never `git add .` / `-A` — risks committing `.env`, `node_modules`, `.DS_Store`
- Never `--no-verify` — if a hook fails, fix the underlying issue
- Never `--force` / `--force-with-lease` to shared branches
- Never amend a pushed commit — create a new commit instead
- Never run git commands from `$HOME` (user did this once — wrong repo)

## Verify you're in the right repo
Before any git command, confirm:
```bash
pwd                         # should be /path/to/Fusion-world
git remote -v               # should show Juan-R1/Fusion-world (or fusion-world)
git branch --show-current   # should show claude/dbfw-market-analytics-1qh5D
```
If `git status` shows `.CFUserTextEncoding`, `Library/`, `Desktop/` — you're in `$HOME`, not the project. `cd ~/Fusion-world` (or wherever it was cloned) before proceeding.

## Commit-message trailer
No trailer needed for human-only commits. The Claude Code session URL trailer is added automatically by the harness when running under `/commit`.
