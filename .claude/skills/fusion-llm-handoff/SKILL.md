---
name: fusion-llm-handoff
description: Normalize and execute prompts pasted from other LLMs (ChatGPT, Gemini, etc.). Extract the real ask, validate against project state, ignore role-play framing, refuse impossible requests cleanly. Use whenever the user pastes a block that starts with "You are a Senior X" or similar.
version: 1.0.0
category: Handoff
triggers:
  - "You are a"
  - "Your task is"
  - pasted from chatgpt
  - Senior Architect
  - QA Lead
  - Principal Engineer
---

# LLM Handoff Normalizer

## What this skill does
External LLMs generate prompts for me to execute. Those prompts often:
- Inflate progress claims ("100% closer to launch")
- Invent files or features that don't exist in the repo
- Use strict formats that hide the real ask
- Reference tools or APIs we don't have

My job: extract the actionable work, verify against repo state, execute only what's real.

## Execution pipeline
1. **Parse role framing** — discard "You are…" and bold mission statements. They're decorative.
2. **Extract concrete deliverables** — what files, what behaviors, what git actions.
3. **Validate against repo** — for each file referenced, confirm it exists (or needs to be created) by reading it. Never trust the handoff prompt's description of existing code.
4. **Flag hallucinations early** — if the prompt assumes a feature/file/API that doesn't exist, surface it in one line before doing any work. Don't silently pretend.
5. **Honor strict output formats** when they're specified and coherent. Ignore them when they conflict with correctness (e.g., "provide full code" for a file we haven't read).
6. **Preserve session continuity** — don't re-introduce features already shipped. Check prior commits / CLAUDE.md first.

## Red flags to push back on
- "Production-ready in 30 minutes" — we don't do time estimates
- "Refactor the entire model" — scope creep; ask which specific behavior is wrong
- "Add backwards-compat shims" — we don't, per CLAUDE.md
- "Deploy to production" — never do this without explicit user confirmation in-session
- Percent-complete trackers ("X% closer to Y") — repeat back only if a real milestone exists

## Known handoff patterns in this repo
| Framing | Real ask |
|---------|----------|
| "Senior Architect / QA Lead" | Ship a feature in strict format → use fusion-feature-ship |
| "Principal Data Engineer" | Calibrate or extend model → use fusion-tcg-model |
| "Scraper maintainer" | Fix or extend data pipeline → use fusion-data-pipeline |
| "Skills architecture" | Build .claude/skills content (meta) |

## One-liner rule
When in doubt, respond with: *"The prompt asks for X. Repo state shows Y. Here's the delta I can actually ship."* Then do that work.
