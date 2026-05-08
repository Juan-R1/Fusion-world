#!/usr/bin/env node
// Team-chat orchestrator: Claude (Architect) -> OpenAI (Builder) -> OpenAI (Reviewer).
// Routes a single task through three roles, persisting state so rate-limit
// pauses can resume without losing work.

import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_DIR = join(__dirname, 'log');
const STATE_DIR = join(__dirname, 'state');

const ROLES = {
  architect: {
    name: 'Architect (Claude)',
    provider: 'anthropic',
    model: process.env.ARCHITECT_MODEL || 'claude-opus-4-7',
    maxTokens: 4096,
    system: `You are the ARCHITECT on a 3-AI team. Your job: turn a user task into a concrete implementation plan that the Builder can execute.

Write a plan with:
1. Goal (1 sentence)
2. Files to create/edit (paths, brief purpose)
3. Key design decisions (with tradeoffs)
4. Step-by-step implementation order
5. Test/verify steps
6. Risks or open questions

Be concise. Plans should be ~200-400 words. Do not write the code itself - that is the Builder's job. Do not review - that is the Reviewer's job.`,
  },
  builder: {
    name: 'Builder (Codex/OpenAI)',
    provider: 'openai',
    model: process.env.BUILDER_MODEL || 'o1',
    maxTokens: 16384,
    system: `You are the BUILDER on a 3-AI team. The Architect produced a plan. Your job: produce the actual code.

For each file in the plan, output:
- A markdown heading with the file path
- The full file contents in a fenced code block

If the plan asks for shell commands or tests, include those too. Stick to the plan unless something is impossible - in that case, flag it explicitly under a "## Builder notes" section.

Do not review your own code - that is the Reviewer's job.`,
  },
  reviewer: {
    name: 'Reviewer (ChatGPT/QA)',
    provider: 'openai',
    model: process.env.REVIEWER_MODEL || 'o1',
    maxTokens: 8192,
    system: `You are the REVIEWER/QA on a 3-AI team. The Architect produced a plan, the Builder produced code. Your job: critique.

Review for:
- Correctness vs. the plan
- Bugs, edge cases, security issues
- Code quality (naming, clarity, simplicity)
- Missing tests or verification
- Missed requirements

End with one of these verdicts on its own line:
  APPROVED  - ready to ship
  REVISE    - Builder needs to fix listed issues
  BLOCKED   - the plan itself is flawed`,
  },
};

const RETRY = {
  maxAttempts: parseInt(process.env.MAX_RETRIES || '20', 10),
  baseDelayMs: 30_000,
  maxBackoffMs: 600_000,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ts = () => new Date().toISOString();
const slug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

function log(...args) {
  console.log(`[${ts()}]`, ...args);
}

async function ensureDirs() {
  await mkdir(LOG_DIR, { recursive: true });
  await mkdir(STATE_DIR, { recursive: true });
}

function parseRetryAfter(headers) {
  const raMs = headers.get('retry-after-ms');
  if (raMs) {
    const n = parseInt(raMs, 10);
    if (!isNaN(n)) return n;
  }
  const ra = headers.get('retry-after');
  if (ra) {
    const n = parseFloat(ra);
    if (!isNaN(n)) return n * 1000;
    const date = Date.parse(ra);
    if (!isNaN(date)) {
      const delta = date - Date.now();
      if (delta > 0) return delta;
    }
  }
  return null;
}

// Reasoning models (o1, o3, o4, gpt-5+) need different API fields and do not
// accept a 'system' role - the system prompt is prepended to the user message.
function isReasoningModel(model) {
  return /^o\d/i.test(model) || /^gpt-5/i.test(model);
}

async function callAnthropic({ model, maxTokens, system, messages }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages }),
  });

  if (!res.ok) {
    const errText = await res.text();
    const err = new Error(`Anthropic ${res.status}: ${errText.slice(0, 500)}`);
    err.status = res.status;
    err.retryAfter = parseRetryAfter(res.headers);
    throw err;
  }

  const data = await res.json();
  const text = (data.content || [])
    .filter((c) => c.type === 'text')
    .map((c) => c.text)
    .join('\n');
  return { text, raw: data };
}

async function callOpenAI({ model, maxTokens, system, messages }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');

  const reasoning = isReasoningModel(model);

  let fullMessages;
  if (reasoning && system) {
    // Prepend system prompt to first user message; reasoning models reject 'system'.
    fullMessages = messages.map((m, i) =>
      i === 0 && m.role === 'user'
        ? { role: 'user', content: `${system}\n\n---\n\n${m.content}` }
        : m,
    );
  } else if (system) {
    fullMessages = [{ role: 'system', content: system }, ...messages];
  } else {
    fullMessages = messages;
  }

  const body = { model, messages: fullMessages };
  body[reasoning ? 'max_completion_tokens' : 'max_tokens'] = maxTokens;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    const err = new Error(`OpenAI ${res.status}: ${errText.slice(0, 500)}`);
    err.status = res.status;
    err.retryAfter = parseRetryAfter(res.headers);
    throw err;
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';
  return { text, raw: data };
}

async function callWithRetry(role, messages) {
  const fn = role.provider === 'anthropic' ? callAnthropic : callOpenAI;
  let lastErr;
  for (let attempt = 1; attempt <= RETRY.maxAttempts; attempt++) {
    try {
      log(`-> ${role.name} (${role.model}) attempt ${attempt}`);
      return await fn({
        model: role.model,
        maxTokens: role.maxTokens,
        system: role.system,
        messages,
      });
    } catch (err) {
      lastErr = err;
      const retriable = err.status === 429 || err.status === 529 || err.status === 503;
      if (!retriable || attempt === RETRY.maxAttempts) throw err;
      // If the API tells us when to retry, honor it exactly (no cap).
      // If not, exponential backoff with a cap so we don't loop forever on a stuck endpoint.
      const delay =
        err.retryAfter != null
          ? err.retryAfter
          : Math.min(RETRY.baseDelayMs * 2 ** (attempt - 1), RETRY.maxBackoffMs);
      const source = err.retryAfter != null ? 'API said wait' : 'backing off';
      log(
        `! ${role.name} hit ${err.status}. ${source} ${Math.round(delay / 1000)}s, retry ${attempt + 1}/${RETRY.maxAttempts}...`,
      );
      await sleep(delay);
    }
  }
  throw lastErr;
}

async function loadState(taskId) {
  const path = join(STATE_DIR, `${taskId}.json`);
  if (!existsSync(path)) return null;
  return JSON.parse(await readFile(path, 'utf8'));
}

async function saveState(state) {
  const path = join(STATE_DIR, `${state.taskId}.json`);
  await writeFile(path, JSON.stringify(state, null, 2));
}

async function appendLog(taskId, role, body) {
  const path = join(LOG_DIR, `${taskId}.md`);
  const block = `\n---\n\n## ${role} - ${ts()}\n\n${body}\n`;
  if (existsSync(path)) {
    await writeFile(path, (await readFile(path, 'utf8')) + block);
  } else {
    await writeFile(path, `# Task: ${taskId}\n\nStarted: ${ts()}\n${block}`);
  }
}

function extractVerdict(text) {
  if (/^\s*APPROVED\s*$/m.test(text)) return 'APPROVED';
  if (/^\s*BLOCKED\s*$/m.test(text)) return 'BLOCKED';
  if (/^\s*REVISE\s*$/m.test(text)) return 'REVISE';
  if (/\bAPPROVED\b/.test(text)) return 'APPROVED';
  if (/\bBLOCKED\b/.test(text)) return 'BLOCKED';
  if (/\bREVISE\b/.test(text)) return 'REVISE';
  return 'UNKNOWN';
}

async function runArchitect(state) {
  const { text } = await callWithRetry(ROLES.architect, [
    { role: 'user', content: state.task },
  ]);
  state.plan = text;
  state.step = 'builder';
  await appendLog(
    state.taskId,
    ROLES.architect.name,
    `**Task**\n\n${state.task}\n\n**Plan**\n\n${text}`,
  );
  await saveState(state);
}

async function runBuilder(state) {
  const userMsg = `# Task\n${state.task}\n\n# Architect's Plan\n${state.plan}\n\nProduce the code.`;
  const { text } = await callWithRetry(ROLES.builder, [
    { role: 'user', content: userMsg },
  ]);
  state.code = text;
  state.step = 'reviewer';
  await appendLog(state.taskId, ROLES.builder.name, text);
  await saveState(state);
}

async function runReviewer(state) {
  const userMsg = `# Task\n${state.task}\n\n# Architect's Plan\n${state.plan}\n\n# Builder's Code\n${state.code}\n\nReview.`;
  const { text } = await callWithRetry(ROLES.reviewer, [
    { role: 'user', content: userMsg },
  ]);
  state.review = text;
  state.verdict = extractVerdict(text);
  state.step = 'done';
  state.finishedAt = ts();
  await appendLog(state.taskId, ROLES.reviewer.name, text);
  await saveState(state);
}

async function runWorkflow(state) {
  while (state.step !== 'done') {
    if (state.step === 'architect') await runArchitect(state);
    else if (state.step === 'builder') await runBuilder(state);
    else if (state.step === 'reviewer') await runReviewer(state);
    else throw new Error(`Unknown step: ${state.step}`);
  }
}

function dryRun(task) {
  log('DRY RUN - no API calls');
  log(`Task: ${task}`);
  for (const role of [ROLES.architect, ROLES.builder, ROLES.reviewer]) {
    log(`Would call ${role.name} via ${role.provider} model=${role.model}`);
  }
  log(`Retry policy: ${JSON.stringify(RETRY)}`);
  log(`Logs: ${LOG_DIR}`);
  log(`State: ${STATE_DIR}`);
}

async function listTasks() {
  if (!existsSync(STATE_DIR)) {
    log('No tasks yet.');
    return;
  }
  const files = (await readdir(STATE_DIR)).filter((f) => f.endsWith('.json')).sort();
  if (files.length === 0) {
    log('No tasks yet.');
    return;
  }
  for (const f of files) {
    const s = JSON.parse(await readFile(join(STATE_DIR, f), 'utf8'));
    console.log(
      `${s.taskId}  step=${s.step}  verdict=${s.verdict || '-'}  task="${s.task.slice(0, 60)}"`,
    );
  }
}

function help() {
  console.log(`
team-chat orchestrator - Claude -> OpenAI -> OpenAI pipeline

Usage:
  node tools/team-chat/orchestrator.mjs "task description"
  node tools/team-chat/orchestrator.mjs --resume <task-id>
  node tools/team-chat/orchestrator.mjs --list
  node tools/team-chat/orchestrator.mjs --dry-run "task description"

Roles:
  Architect  -> Claude (${ROLES.architect.model})    plans the work
  Builder    -> OpenAI (${ROLES.builder.model})       writes the code
  Reviewer   -> OpenAI (${ROLES.reviewer.model})      reviews + verdict

Env vars:
  ANTHROPIC_API_KEY   required - Architect
  OPENAI_API_KEY      required - Builder + Reviewer
  ARCHITECT_MODEL     optional - override Claude model
  BUILDER_MODEL       optional - override Builder OpenAI model
  REVIEWER_MODEL      optional - override Reviewer OpenAI model
  MAX_RETRIES         optional - retry attempts on rate-limit (default 20, honors API retry-after fully)

Output:
  log/<task-id>.md     full transcript
  state/<task-id>.json resumable state
`.trimStart());
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--list') args.list = true;
    else if (a === '--resume') args.resume = argv[++i];
    else if (a === '--help' || a === '-h') args.help = true;
    else args._.push(a);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) return help();
  if (args.list) {
    await ensureDirs();
    return listTasks();
  }

  await ensureDirs();

  if (args.dryRun) {
    const task = args._.join(' ').trim();
    if (!task) {
      console.error('--dry-run needs a task description');
      process.exit(1);
    }
    return dryRun(task);
  }

  let state;
  if (args.resume) {
    state = await loadState(args.resume);
    if (!state) {
      console.error(`No state for task: ${args.resume}`);
      process.exit(1);
    }
    log(`Resuming ${state.taskId} at step=${state.step}`);
  } else {
    const task = args._.join(' ').trim();
    if (!task) {
      help();
      process.exit(1);
    }
    const taskId = `${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}-${slug(task)}`;
    state = { taskId, task, step: 'architect', startedAt: ts() };
    await saveState(state);
    log(`New task ${taskId}`);
  }

  try {
    await runWorkflow(state);
    log(
      `Done. Verdict: ${state.verdict}. Log: ${join(LOG_DIR, state.taskId + '.md')}`,
    );
  } catch (err) {
    log(`! Failed at step=${state.step}:`, err.message);
    log(`State saved. Resume with: --resume ${state.taskId}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
