# Prompt Logs

This directory contains prompt logs — a **required assignment deliverable** that provides full visibility into how the AI layer is orchestrated.

---

## Purpose

Prompt logs demonstrate:
- The system prompt(s) used
- How user prompts are constructed from structured metric data
- The exact structured input sent to the model (JSON — not raw HTML)
- The raw model output before any formatting or parsing

---

## Log Format

Each log file follows this structure:

```markdown
## Audit: {url} — {ISO timestamp}

### System Prompt

{full system prompt text}

### User Prompt (constructed)

{rendered template with all metric values filled in}

### Structured Input (sent to model)

\`\`\`json
{
  "url": "...",
  "metrics": { ...all PageMetrics fields },
  "contentExcerpt": "first 5000 chars of body text"
}
\`\`\`

### Raw Model Output

\`\`\`json
{raw OpenAI response content string before Zod parsing}
\`\`\`

### Notes

- Model: gpt-4o
- Timestamp: ISO 8601
- Prompt tokens: N  |  Completion tokens: N  |  Total: N
- Redactions: API key not included; full page HTML not included
```

---

## Directory Structure

```
docs/prompt-logs/
├── README.md                  ← this file
├── .gitkeep                   ← keeps directory in git
├── examples/                  ← curated logs committed for submission
│   ├── .gitkeep
│   ├── 01-well-grounded.md    ← insights cite specific numbers
│   ├── 02-edge-case.md        ← missing H1, no meta description
│   └── 03-strong-seo.md       ← shows tool doesn't over-criticize
└── {YYYY-MM-DD}/              ← runtime logs (gitignored)
    └── {uuid}.md
```

---

## Redaction Policy

The following are **always redacted** from logs:
- `OPENAI_API_KEY` and all environment secrets
- Full raw HTML of the fetched page (replaced by truncated `contentExcerpt`)
- Any personally identifiable information (PII) found in page content

The following are **never redacted**:
- Metric values (these are what ground the AI analysis)
- Prompt text (this is the deliverable)
- Model output (this is what we're auditing)

---

## Runtime vs Curated Logs

| Path | Status | Purpose |
|------|--------|---------|
| `docs/prompt-logs/{date}/` | Gitignored | Auto-generated during local development |
| `docs/prompt-logs/examples/` | Committed | Hand-selected representative logs for submission |

To promote a runtime log to a submission example:
1. Run an audit locally
2. Find the generated file in `docs/prompt-logs/{today}/`
3. Copy it to `docs/prompt-logs/examples/` with a descriptive name
4. Commit it

---

## Implementation

Logs are written by `src/lib/logging/prompt-logger.ts` (stub in Phase 0, full implementation in Phase 2).

`writePromptLog(entry: PromptLogEntry)` is called after every OpenAI response in `src/lib/ai/analyze-page.ts`.
