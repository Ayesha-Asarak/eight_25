---
name: assignment-readme
description: README and documentation template for the EIGHT25 assignment submission. Use when writing or updating README.md, ARCHITECTURE.md, or any final deliverable documentation.
disable-model-invocation: true
---

# Assignment README

Use this template structure when writing the final `README.md`.

## Required Sections (must all be present)

### 1. Quick Start

```markdown
## Quick Start

\`\`\`bash
git clone https://github.com/{user}/eight25-website-audit
cd eight25-website-audit
npm install
cp .env.example .env.local
# Add your OPENAI_API_KEY to .env.local
npm run dev
\`\`\`

Open http://localhost:3000, enter any public URL, and run an audit.
```

### 2. Deployed Link

```markdown
## Live Demo

https://{your-vercel-deployment}.vercel.app
```

### 3. Architecture Overview

Include a mermaid diagram showing the data flow:
`URL → fetch → Cheerio parse → metrics extraction → AI input build → OpenAI → response → UI`

Describe each layer's responsibility in 1–2 sentences.

### 4. AI Design Decisions

Cover:
- Why structured JSON output (`response_format: json_schema`) over free-text
- Why metrics are extracted first and sent as structured data (not raw HTML)
- Content truncation strategy (5000 char excerpt)
- Retry-once on Zod validation failure

### 5. Trade-offs

Be honest about limitations:
- CTA heuristic is approximate (misses JS-rendered and CSS-only CTAs)
- Content truncated at 5000 chars — long pages may have incomplete analysis
- Some sites block headless fetchers (bot protection)
- Vercel Hobby plan has 10s function timeout — some slow sites may fail

### 6. Future Improvements

- Lighthouse integration for performance/accessibility scores
- Caching audit results per URL hash (Redis / KV)
- Side-by-side comparison of two URLs
- Export audit as PDF
- Rate limiting to prevent abuse

### 7. Prompt Logs

```markdown
## Prompt Logs

Prompt logs are in [`docs/prompt-logs/examples/`](docs/prompt-logs/examples/).

Each log contains:
- System prompt used
- Rendered user prompt
- Structured input sent to the model (metrics JSON)
- Raw model output before formatting
```

## ARCHITECTURE.md

Separate file with more detail:
- Sequence diagram (mermaid)
- Layer responsibilities table
- Error handling strategy
- Data flow with types
