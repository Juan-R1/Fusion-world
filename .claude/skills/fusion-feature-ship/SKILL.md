---
name: fusion-feature-ship
description: Strict-format output for shipping a new dashboard feature end-to-end — file list, full code, git commands, test steps. Use whenever the user says "build the next feature", "ship X", or pastes an Architect/QA-Lead prompt.
version: 1.0.0
category: Core Workflow
triggers:
  - "build the next feature"
  - "ship X as the next feature"
  - "Senior Architect"
  - "final polish"
  - "You are Architect"
---

# Fusion Feature Shipper

Respond ONLY in the following exact structure. No preamble, no "I'll now…", no recap after.

## Required output structure

### FusionMetrics Next Feature: <Feature Name>
One paragraph explaining why this feature matters for DBFW collectors/flippers. Tie it to real collector behavior (card shows, locals, box cracking, watchlist maintenance). Never generic.

### New Files to Create / Update
Bullet list, full path from repo root, with `(new)` or `(update)` marker.

### Complete Code
One fenced code block per file. First line is a `// path/to/file` comment. Provide the FULL file content — no `// ... unchanged` placeholders, no diff fragments. Reader must be able to copy-paste each block directly over the existing file.

### Exact Git Commands
A single bash fenced block with `git add <explicit paths>`, `git commit -m "..."` using a HEREDOC-safe single-line message, and `git push -u origin claude/dbfw-market-analytics-1qh5D`. Never `git add .` or `-A`.

### Test Steps
Numbered list. Must include:
1. Wait for Vercel deploy
2. Desktop browser check (specific UI elements)
3. DevTools mobile emulation check (iPhone 14 Pro)
4. Real-data check (specific card code or set to verify)
5. Edge case (empty state, error state, or persistence across refresh)

Architecture Sign-Off: YES — justify in one clause.
App progress after this response: X% closer to <goal>.

## Hard rules
- Never include code you haven't reasoned about against existing files. Read first if uncertain.
- All new React files use inline-style theme tokens from `src/theme.js` (`T.bg`, `T.orange`, `T.s1`, `T.border`, `T.mono`, `T.display`, etc.). No CSS modules, no Tailwind.
- All new hooks live in `src/hooks/`. All new tabs live in `src/tabs/`. All new components in `src/components/`.
- Persistence always via localStorage with a versioned key (`fw-<feature>-v1`).
- Mobile-first: any new tab must use `useIsMobile()` and support stacked layout + fullscreen CardDetail overlay pattern.
- Never invent card data or rarities. All values trace to `src/data.js` or `src/livePrices.json`.

## Style
- Commit message format: `feat: <tab-name> <1-line summary>` or `fix:` / `chore:`.
- No emojis in commit messages. Emojis only in tab labels and UI copy.
- No time estimates. No "this should take…".
