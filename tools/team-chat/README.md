# team-chat

Three-AI orchestrator that hands a task through Claude (Architect) -> OpenAI (Builder) -> OpenAI (Reviewer) without you in the middle. Persists state so rate-limit pauses can resume.

## Roles

| Role      | Model (default)        | Job                                           |
|-----------|------------------------|-----------------------------------------------|
| Architect | `claude-opus-4-7`      | Turn the task into a concrete plan            |
| Builder   | `o1`                   | Produce the actual code from the plan         |
| Reviewer  | `o1`                   | Critique the code, return APPROVED / REVISE / BLOCKED |

Defaults are the highest models known as of Claude's Jan 2026 cutoff. If a stronger model has shipped since (e.g. `gpt-5`, `o3`, `claude-opus-5`), override via env var:

```sh
ARCHITECT_MODEL=claude-opus-5 BUILDER_MODEL=gpt-5 REVIEWER_MODEL=gpt-5 \
  node tools/team-chat/orchestrator.mjs "..."
```

The OpenAI client auto-detects reasoning models (`o*`, `gpt-5+`) and uses `max_completion_tokens` + embeds the system prompt into the user message, since those models reject the `system` role.

Roles are defined in `orchestrator.mjs` — edit the `system` strings there to tune behavior.

## Setup

1. Copy the env template:
   ```sh
   cp tools/team-chat/.env.example tools/team-chat/.env
   ```
2. Fill in your keys in `tools/team-chat/.env`.
3. Source it before running (or use `dotenv`):
   ```sh
   set -a && source tools/team-chat/.env && set +a
   ```

No npm dependencies. Requires Node 18+ for native `fetch`.

## Usage

```sh
# new task (full pipeline: Architect -> Builder -> Reviewer)
node tools/team-chat/orchestrator.mjs "add a /healthcheck endpoint that returns version + timestamp"

# show what the orchestrator WOULD call, no API hits
node tools/team-chat/orchestrator.mjs --dry-run "any task here"

# list all past tasks and their verdicts
node tools/team-chat/orchestrator.mjs --list

# resume a task that hit a long rate-limit pause and got killed
node tools/team-chat/orchestrator.mjs --resume 2026-05-08-12-00-00-add-a-healthcheck-endpoint
```

## Output

Each task produces two artifacts:

- `tools/team-chat/log/<task-id>.md` — human-readable transcript: task, plan, code, review.
- `tools/team-chat/state/<task-id>.json` — resumable state. Survives kills; `--resume` picks up at the last completed step.

Both directories are gitignored.

## Rate-limit handling

When a provider returns 429 / 503 / 529, the orchestrator:

1. Reads `retry-after`, `retry-after-ms`, or HTTP-date from the response headers.
2. **If the API tells us how long to wait, we wait that long — no cap.** A 1-hour pause is honored as 1 hour.
3. If no header is provided, falls back to exponential backoff: 30s, 60s, 120s, 240s, 480s (capped at 10 min only when there's no API guidance).
4. Retries up to `MAX_RETRIES` (default 20).
5. After max attempts, saves state and exits non-zero. Restart later with `--resume <task-id>` and it picks up at the same step — no work lost.

If you Ctrl-C mid-call, the in-flight step is lost but the previous step's output is preserved in state.

## Model overrides

```sh
ARCHITECT_MODEL=claude-opus-4-7 \
BUILDER_MODEL=o1-pro \
REVIEWER_MODEL=o1 \
node tools/team-chat/orchestrator.mjs "..."
```

The OpenAI client auto-detects reasoning models (anything matching `^o\d` or `^gpt-5`) and adjusts the request shape: uses `max_completion_tokens` and embeds the system prompt into the user message. Standard chat models (`gpt-4o`, `gpt-4-turbo`) keep the conventional `system` role + `max_tokens`.

## What this is and isn't

**Is:** an automated handoff pipeline so the three AIs can move a task forward without you copy/pasting between them.

**Isn't:** a real-time chat between agents, an automatic code-applier, or a replacement for human review. The Builder's output is markdown-with-code-blocks — applying it to your repo is still a human (or Claude Code) step.

## Extending

- Add a revision loop: if `state.verdict === 'REVISE'`, send the review back to the Builder with the issues, then re-review. Cap at N rounds.
- Swap the Reviewer's provider: change `provider` in `ROLES.reviewer` to `'anthropic'` and pick a Claude model for a different second opinion.
- Pipe to file edits: parse the Builder's code blocks and write them to disk. Keep behind a `--apply` flag — easy to break things otherwise.
