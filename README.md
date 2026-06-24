# Website Audit Tool — EIGHT25MEDIA

> AI-powered single-page website auditor. Extracts factual metrics deterministically, then generates structured insights using OpenAI gpt-4o. Factual data and AI output are kept strictly separate throughout — in the code, the API, and the UI.

**Live Demo:** https://eight25-website-audit.vercel.app _(replace with your deployed URL)_

---

## Quick Start

```bash
git clone https://github.com/Ayesha-Asarak/eight_25.git
cd eight_25
npm install
cp .env.example .env.local
# Edit .env.local and set OPENAI_API_KEY=sk-...
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), enter any public URL, and click **Run Audit**.

---

## Architecture Overview

The audit pipeline follows a strict unidirectional flow with enforced layer boundaries:

```
User URL
   │
   ▼
POST /api/audit
   │
   ├─► scrapePage()         src/lib/scraper/    fetch HTML → Cheerio DOM
   │       │
   │       ▼
   │   extractMetrics()     src/lib/metrics/    11 deterministic metrics
   │       │
   ├─► analyzePage()        src/lib/ai/         build input → gpt-4o → Zod validate
   │       │
   │       ├─► writePromptLog()   src/lib/logging/   full trace to docs/prompt-logs/
   │       │
   │       └─► AuditInsights
   │
   └─► AuditResult → UI
           │
           ├── MetricsPanel        (blue)   factual only
           ├── InsightsPanel       (violet) AI-generated
           └── RecommendationsPanel (amber) AI-generated, priority-sorted
```

**Key design principle:** the AI layer receives a structured JSON payload containing extracted metrics and a plain-text excerpt — never raw HTML. This grounds every AI finding in real, deterministic data.

Full detail in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## AI Design Decisions

### 1. Structured JSON output (`response_format: json_schema`)

The OpenAI call uses `response_format: { type: "json_schema" }` with a hand-written JSON schema matching `AuditInsightsSchema`. This guarantees the model returns parseable, schema-conformant JSON rather than free-text — eliminating the need for fragile regex or prose parsing.

### 2. Metrics extracted first, sent as structured data

The AI layer receives an `AIStructuredInput` object:

```json
{
  "url": "...",
  "metrics": { "wordCount": 847, "h1Count": 1, ... },
  "contentExcerpt": "first 5000 characters of body text"
}
```

The model never sees raw HTML. This prevents token waste, reduces hallucination risk, and ensures every finding can be traced back to a deterministic metric value.

### 3. Content excerpt truncation at 5000 characters

Long pages are truncated to 5000 characters of plain body text. This keeps the prompt within a cost-effective token budget while giving the model enough context to assess messaging, CTA language, and content depth. The truncation boundary is logged so it is visible in prompt logs.

### 4. Retry once on Zod validation failure

If the model returns JSON that fails `AuditInsightsSchema` validation, the call is retried exactly once (`MAX_VALIDATION_RETRIES = 1`). A second failure raises a `ValidationError` and returns an `AI_FAILED` response. This prevents infinite loops while handling rare model lapses gracefully.

### 5. Prompts in dedicated files, not inline

System and user prompts live in `src/lib/ai/prompts/system.ts` and `src/lib/ai/prompts/user-template.ts`. The API route never contains prompt strings — this makes prompt engineering changes reviewable as code changes, keeps the route handler clean, and allows prompts to be tested independently.

---

## Trade-offs

| Limitation | Detail |
|-----------|--------|
| **CTA heuristic is approximate** | CTAs are detected by tag name, `role="button"`, CSS class keywords (`btn`, `cta`), and link text patterns. JavaScript-rendered buttons and CSS-only styled CTAs are not detected. |
| **Content truncated at 5000 characters** | Pages longer than ~5000 characters of body text will have their content partially analysed. Deep-page content (footers, FAQs) may not influence AI findings. |
| **Some sites block headless fetchers** | Pages behind Cloudflare bot protection, login walls, or requiring JavaScript rendering will return a `FETCH_FAILED` error. |
| **Vercel Hobby plan timeout** | The API route sets `maxDuration = 60` seconds, but Vercel Hobby plan caps serverless functions at 10 seconds. Slow target sites or high OpenAI latency may cause timeout errors on Hobby. Upgrade to Pro for reliable 60s execution. |
| **Single page only** | The tool audits exactly one URL per request. No sitemap crawling, no multi-page analysis. |

---

## Future Improvements

- **Lighthouse integration** — add performance, accessibility, and best-practices scores alongside extracted metrics
- **Result caching** — cache `AuditResult` per URL hash (Redis/Vercel KV) to avoid redundant OpenAI calls
- **Side-by-side comparison** — compare two URLs and highlight metric deltas
- **Export as PDF** — allow users to download the full audit report
- **Rate limiting** — add IP-based rate limiting on `POST /api/audit` to prevent abuse
- **JavaScript rendering** — use a headless browser (e.g. Playwright) for JS-heavy SPAs that return empty HTML to a plain fetch

---

## Prompt Logs

Prompt logs are a **required deliverable**. They provide full transparency into how the AI layer is orchestrated — including the exact prompts, structured input, and raw model output for each audit.

Curated examples are in [`docs/prompt-logs/examples/`](docs/prompt-logs/examples/):

| File | Demonstrates |
|------|-------------|
| [`01-well-grounded.md`](docs/prompt-logs/examples/01-well-grounded.md) | Findings correctly cite specific metric values (`altTextPercent: 87.5`, `ctaCount: 4`) |
| [`02-edge-case.md`](docs/prompt-logs/examples/02-edge-case.md) | Critical gaps: `h1Count: 0`, `metaDescription: null`, `ctaCount: 0`, `wordCount: 203` |
| [`03-strong-seo.md`](docs/prompt-logs/examples/03-strong-seo.md) | Strong page — tool gives balanced, constructive feedback rather than over-criticising |

Each log contains:
- Full system prompt
- Rendered user prompt (with all metric values filled in)
- Structured input JSON sent to the model
- Raw model output before Zod parsing
- Model, timestamp, and token usage

Runtime logs (generated during `npm run dev`) write to `docs/prompt-logs/{YYYY-MM-DD}/` and are gitignored. To promote a runtime log to a curated example, copy it to `docs/prompt-logs/examples/`.

---

## Project Structure

```
src/
├── app/
│   ├── api/audit/        # POST /api/audit — pipeline orchestration
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── scraper/          # HTTP fetch + Cheerio DOM loading (no AI)
│   ├── metrics/          # Pure metric extractor functions (no AI)
│   ├── ai/               # Prompts, OpenAI call, Zod validation
│   │   └── prompts/      # system.ts + user-template.ts
│   ├── api/              # Request validation + error mapping
│   └── logging/          # Prompt log writer
├── components/           # React UI: AuditPage, MetricsPanel, InsightsPanel, etc.
├── hooks/                # useAudit — client state machine
└── types/                # Shared Zod schemas and TypeScript types
docs/
├── ARCHITECTURE.md       # Detailed architecture documentation
└── prompt-logs/
    └── examples/         # Curated prompt logs for submission
.cursor/
├── rules/                # Cursor agent rules (4 files)
└── skills/               # Cursor project skills (3 files)
```

---

## Stack

| Concern | Choice | Reason |
|---------|--------|--------|
| Framework | Next.js 15 App Router + TypeScript | Full-stack, API routes, Vercel-ready |
| Styling | Tailwind CSS v4 | Rapid, consistent, agency-quality UI |
| HTML parsing | Cheerio | Lightweight, jQuery-like, server-side only |
| AI provider | OpenAI gpt-4o | Structured JSON output, best reasoning quality |
| Schema validation | Zod | End-to-end type safety from API to UI |
| Testing | Vitest | Fast, ESM-native, path alias support |
| Deployment | Vercel | Native Next.js support |

---

## Development Commands

```bash
npm run dev          # Start local dev server on :3000
npm test             # Run all unit tests (vitest)
npm run test:watch   # Tests in watch mode
npm run type-check   # tsc --noEmit
npm run build        # Production build
npm run lint         # ESLint
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key — used by `src/lib/ai/openai-client.ts` |

Copy `.env.example` to `.env.local` and fill in the key. Never commit `.env.local`.
