---
name: prompt-logging
description: Defines the mandatory prompt log format and process for every OpenAI call. Use when adding, modifying, or reviewing AI calls, prompts, or docs/prompt-logs deliverables.
disable-model-invocation: true
---

# Prompt Logging

Every OpenAI call in this project must produce a prompt log. This is a required assignment deliverable demonstrating AI orchestration transparency.

## Mandatory Log Format

Each log file at `docs/prompt-logs/{YYYY-MM-DD}/{id}.md` must contain:

```markdown
## Audit: {url} — {ISO timestamp}

### System Prompt

{full system prompt text — no truncation}

### User Prompt (constructed)

{fully rendered user prompt with all metric values filled in}

### Structured Input (sent to model)

\`\`\`json
{
  "url": "...",
  "metrics": { ...PageMetrics },
  "contentExcerpt": "first 5000 chars of page body text"
}
\`\`\`

### Raw Model Output

\`\`\`json
{raw OpenAI response content — before Zod parsing}
\`\`\`

### Notes

- Model: gpt-4o
- Timestamp: {ISO}
- Redactions: API key redacted from environment; full HTML not included
```

## File Locations

| Path | Contents |
|------|----------|
| `docs/prompt-logs/{date}/{id}.md` | Runtime logs (gitignored in dev) |
| `docs/prompt-logs/examples/` | Curated submission examples (committed to repo) |

## Implementation

`src/lib/logging/prompt-logger.ts` exports:

- `writePromptLog(entry: PromptLogEntry): Promise<string>` — writes the `.md` file, returns file path
- `formatPromptLogMarkdown(entry: PromptLogEntry): string` — renders the markdown string

## Submission Requirements

Before submission, commit 3–5 representative logs to `docs/prompt-logs/examples/` that show:
1. A well-grounded audit (insights cite specific numbers)
2. An edge-case audit (missing H1, no meta description)
3. A well-optimized page (shows the tool doesn't over-criticize)
