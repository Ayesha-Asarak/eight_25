# Website Audit Tool — EIGHT25MEDIA

> AI-powered single-page website auditor built for EIGHT25MEDIA. Extracts 11 factual metrics deterministically, then generates structured insights using Google Gemini. Factual data and AI output are kept strictly separate throughout — in the code, the API, and the UI.

**Live Demo:** [https://eight-25.vercel.app](https://eight-25.vercel.app)

---

## Quick Start

```bash
git clone https://github.com/Ayesha-Asarak/eight_25.git
cd eight_25
npm install
cp .env.example .env.local
# Edit .env.local — set GEMINI_API_KEY (see Environment Variables below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), enter any public URL, and click **Run Audit**.

---

## Architecture Overview

The audit pipeline follows a strict unidirectional flow with enforced layer boundaries. No layer can import from a layer ahead of it.

```
User URL
   │
   ▼
POST /api/audit
   │
   ├─► scrapePage()          src/lib/scraper/
   │       ├─ fetch-page.ts       HTTP fetch with timeout + User-Agent
   │       └─ parse-html.ts       Cheerio DOM loading
   │
   ├─► extractMetrics()      src/lib/metrics/
   │       └─ 11 deterministic extractors (zero AI imports)
   │
   ├─► fetchPageSpeed()      src/lib/performance/
   │       └─ Google PageSpeed Insights API (runs in parallel with scrape)
   │
   ├─► analyzePage()         src/lib/ai/
   │       ├─ build-input.ts       structured JSON payload (never raw HTML)
   │       ├─ prompts/system.ts    expert persona + anti-loop constraints
   │       ├─ prompts/user-template.ts  rendered user prompt with metric values
   │       ├─ openai-client.ts     callGemini() with model fallback chain
   │       └─ writePromptLog()     full trace → docs/prompt-logs/
   │
   └─► AuditResult → UI
           ├── MetricsPanel           factual metrics (blue accent)
           ├── InsightsPanel          AI analysis (category cards)
           └── RecommendationsPanel   priority-sorted, metric-grounded
```

### Layer Boundaries (Hard Rules)

| Directory | Owns | Forbidden |
|-----------|------|-----------|
| `src/lib/scraper/` | HTTP fetch, Cheerio DOM | OpenAI/Gemini imports, metric logic |
| `src/lib/metrics/` | Pure extractor functions | AI imports, fetch logic |
| `src/lib/performance/` | PageSpeed API call | Scraper or metric logic |
| `src/lib/ai/` | Prompts, Gemini call, Zod validation | Direct fetch, Cheerio |
| `src/lib/logging/` | Prompt log writer | Business logic |
| `src/app/api/audit/` | Route orchestration, error handling | Inline prompts, direct AI |

**Key design principle:** The AI layer receives a structured JSON payload containing extracted metrics and a plain-text content excerpt — never raw HTML. This grounds every AI finding in real, deterministic data and eliminates token waste from HTML boilerplate.

Full architecture detail: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## AI Design Decisions

### 1. Structured input — never raw HTML

The AI layer receives an `AIStructuredInput` object, not HTML:

```json
{
  "url": "https://example.com",
  "metrics": {
    "wordCount": 847,
    "h1Count": 1,
    "h2Count": 6,
    "ctaCount": 4,
    "altTextPercent": 87.5,
    "metaTitle": "Example — Build better websites",
    "seoScore": 91
  },
  "contentExcerpt": "first 5 000 characters of body text..."
}
```

This prevents hallucination from HTML noise, keeps the prompt within a cost-efficient token budget, and ensures every AI finding can be traced directly to a measurable value.

### 2. Gemini native SDK with `responseJsonSchema` enforcement

Rather than using the OpenAI-compatible Gemini endpoint (which doesn't reliably support `response_format`), the tool uses the official `@google/genai` SDK with `responseMimeType: 'application/json'` and `responseJsonSchema` set to the full `AuditInsightsSchema` definition. This forces structured JSON output at the API level before Zod parsing, eliminating most parse failures.

### 3. Model fallback chain for free-tier resilience

Free-tier Gemini quota is per Google Cloud **project**, not per API key. To handle quota exhaustion and model overload gracefully, a fallback chain is tried in order:

```
gemini-2.5-flash-lite  →  gemini-2.5-flash  →  gemini-2.0-flash-lite  →  gemini-2.0-flash
```

Each model has its own independent quota bucket. 429 (quota exceeded) and 503 (overloaded) errors skip to the next model. 404 (model not found) errors also skip — this protects against model deprecations without a code deploy.

### 4. Anti-loop system prompt instructions

After observing API token spikes caused by unintentional retry loops, the system prompt now includes explicit operational constraints:

- **Concise output**: model is instructed to keep responses brief and structured
- **Single pass**: explicitly told it will be called exactly once per audit
- **Loop detection**: if the model detects repeated identical input, it outputs `[HALT_FLOW: Loop Detected]` and halts
- **No recursion**: no clarifying questions that would force an automated reply

### 5. Hard call cap and in-flight guard

Beyond the prompt-level instructions, two code-level safeguards prevent request storms:

- `MAX_API_CALLS_PER_REQUEST = 4` — the fallback loop never exceeds 4 Gemini calls regardless of chain length
- `MODEL_FALLBACK_DELAY_MS = 300` — a 300 ms pause between fallback attempts prevents rapid-fire quota bursts
- `MAX_VALIDATION_RETRIES = 0` — no retry on Zod validation failure (schema enforcement at the API level makes retries unnecessary and doubles call counts)
- `inFlight` ref in `useAudit` — a `useRef` lock on the client prevents concurrent duplicate requests from double-clicks or React re-renders

### 6. Prompts in dedicated files, never inline

System and user prompts live in `src/lib/ai/prompts/system.ts` and `src/lib/ai/prompts/user-template.ts`. The API route never contains prompt strings. This makes prompt engineering changes reviewable as code changes, keeps route handlers clean, and allows prompts to be unit-tested independently.

### 7. Every OpenAI call is logged

`writePromptLog()` is called on every Gemini request — even failed ones. Each log contains: full system prompt, rendered user prompt (with all metric values filled in), structured input JSON, raw model output before Zod parsing, model name, timestamp, token usage, and the target URL. Logs write to `docs/prompt-logs/{YYYY-MM-DD}/` in development.

---

## Trade-offs

| Limitation | Detail |
|-----------|--------|
| **CTA heuristic is approximate** | CTAs are detected by tag name, `role="button"`, CSS class keywords (`btn`, `cta`, `button`), and link-text patterns. JavaScript-rendered buttons and CSS-only styled CTAs are not detected. |
| **Content truncated at 5 000 characters** | Pages longer than ~5 000 characters of body text will have content partially analysed. Deep-page content (footers, FAQs) may not influence AI findings. |
| **Some sites block headless fetchers** | Pages behind Cloudflare bot protection, login walls, or requiring JavaScript rendering return a `FETCH_FAILED` error. A headless browser would be needed to handle these. |
| **Free-tier quota resets daily** | Gemini's free tier is generous (~1 000 req/day on Flash-Lite) but resets at midnight Pacific. Heavy testing in a single day can exhaust the quota across all fallback models. |
| **Single page only** | The tool audits exactly one URL per request. No sitemap crawling, no multi-page analysis — by design, as per the assignment brief. |
| **PageSpeed scores are best-effort** | The Google PageSpeed Insights API has its own rate limits and can time out on slow target sites. When unavailable, scores show as null and the AI notes this explicitly rather than hallucinating a value. |
| **In-memory rate limiting** | The API allows 5 requests per IP per 15 minutes. This counter resets on Vercel cold starts and is not shared across serverless instances. |

---

## What I Would Improve With More Time

### Performance & Reliability
- **Result caching** — cache `AuditResult` per URL hash (Redis / Vercel KV) to avoid redundant Gemini calls for popular URLs
- **JavaScript rendering** — use Playwright or Puppeteer for JS-heavy SPAs that return near-empty HTML to a plain `fetch`
- **Streaming responses** — stream AI output token-by-token to the UI so users see insights appearing rather than waiting 10–30 seconds

### AI Quality
- **Competitor comparison** — accept two URLs and diff the metrics; the AI could identify relative strengths and weaknesses
- **Confidence scoring** — attach a confidence level to each finding based on data completeness (e.g. lower confidence when `seoScore` is null)
- **Multi-turn refinement** — allow users to ask follow-up questions grounded in the same audit snapshot without re-fetching

### Product
- **Export as PDF** — one-click branded PDF report suitable for client delivery
- **Side-by-side comparison** — compare before/after URLs across a redesign
- **Scheduled audits** — re-audit a URL on a schedule and alert on metric regressions
- **Shareable audit links** — persist results and generate a public read-only URL

### Engineering
- **End-to-end tests** — Playwright tests covering the full happy path, error states, and download flow
- **OpenTelemetry tracing** — trace each audit request through all layers for production observability
- **Prompt versioning** — version the system and user prompts so regressions are detectable when prompts change

---

## Cursor AI Development Setup

This project was built using **Cursor** as the primary IDE. Several Cursor-specific configuration files were created to keep the AI agent consistent, safe, and productive across the entire development session.

### `.cursor/rules/` — Persistent Agent Rules

Rules are applied automatically by Cursor whenever the agent edits files matching their glob pattern. They encode architectural boundaries and coding standards that would otherwise need to be re-explained in every prompt.

| Rule File | Scope | Purpose |
|-----------|-------|---------|
| `project-context.mdc` | Always applied | Hard constraints: single URL, separate factual/AI, prompt log policy, architecture boundaries |
| `ai-layer.mdc` | `src/lib/ai/**` | Prompt file location, `responseJsonSchema` usage, grounded-findings requirement, logging on every call |
| `scraper-layer.mdc` | `src/lib/scraper/**` | No AI imports, no metric logic — pure HTTP fetch and Cheerio DOM only |
| `typescript-standards.mdc` | `src/**` | No `any` in core layers, Zod for all schemas, import-from-`@/types` rule |

**Why this matters:** Without rules, the AI agent would inline prompts in route handlers, import OpenAI in the scraper layer, or use `any` types under time pressure. The rules function as an automated code reviewer that runs before every edit.

### `.cursor/skills/` — Reusable Agent Playbooks

Skills are instruction files the agent reads on demand to execute complex multi-step tasks reproducibly.

| Skill | Trigger | What It Does |
|-------|---------|--------------|
| `website-audit-workflow` | Building or modifying the audit pipeline | Step-by-step checklist: update Zod schema → implement extractor → wire into route → test on real URLs → verify prompt log written |
| `prompt-logging` | Adding or modifying any Gemini call | Ensures `writePromptLog()` is called correctly, log format is complete, and logs are gitignored except curated examples |
| `assignment-readme` | Updating project documentation | Ensures README covers all evaluation criteria: architecture, AI decisions, trade-offs, prompt logs, and live demo URL |

**Why this matters:** Skills encode the "how" of recurring tasks so the agent doesn't need to rediscover the correct approach each time. They also encode constraints that are easy to forget under iteration pressure (e.g. "log even on failure").

### `AGENTS.md` — Single Source of Truth

`AGENTS.md` at the repo root is the authoritative specification the Cursor agent reads before any change. It defines:
- Assignment objective and evaluation criteria
- Stack decisions with rationale
- All 11 required factual metrics
- The `AuditInsights` output schema
- The CTA detection heuristic
- Prompt log policy
- What not to do

By committing `AGENTS.md`, every Cursor session — current or future — starts from the same shared context without needing a project-briefing prompt.

---

## Prompt Logs

Prompt logs are a **required deliverable**. They provide full transparency into how the AI layer is orchestrated.

Curated examples: [`docs/prompt-logs/examples/`](docs/prompt-logs/examples/)

Each log contains:
- Full system prompt
- Rendered user prompt (with all metric values substituted in)
- Structured input JSON sent to the model
- Raw model output before Zod parsing
- Model name, timestamp, and token usage

Runtime logs (generated during `npm run dev`) write to `docs/prompt-logs/{YYYY-MM-DD}/` and are gitignored. To promote a runtime log to a curated example, copy it to `docs/prompt-logs/examples/`.

---

## Project Structure

```
src/
├── app/
│   ├── api/audit/        # POST /api/audit — route orchestration only
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── scraper/          # HTTP fetch + Cheerio DOM (zero AI)
│   ├── metrics/          # 11 pure extractor functions (zero AI)
│   ├── performance/      # Google PageSpeed Insights fetcher
│   ├── ai/               # Gemini call, Zod validation, prompt logging
│   │   └── prompts/      # system.ts + user-template.ts
│   ├── api/              # Request validation + typed error mapping
│   └── logging/          # Prompt log writer
├── components/           # React UI: AuditPage, MetricsPanel, InsightsPanel, etc.
├── hooks/                # useAudit — client state machine with in-flight guard
└── types/                # Shared Zod schemas and TypeScript types
docs/
├── ARCHITECTURE.md       # Detailed architecture documentation
└── prompt-logs/
    └── examples/         # Curated prompt logs for submission
.cursor/
├── rules/                # 4 Cursor agent rules (always-applied + glob-scoped)
└── skills/               # 3 Cursor agent skills (workflow playbooks)
AGENTS.md                 # Authoritative project spec — read before every change
```

---

## Stack

| Concern | Choice | Reason |
|---------|--------|--------|
| Framework | Next.js 15 App Router + TypeScript | Full-stack, API routes, Vercel-ready |
| Styling | Tailwind CSS v4 | Rapid, consistent UI |
| HTML parsing | Cheerio | Lightweight, jQuery-like, server-side only |
| AI provider | Google Gemini 2.5 Flash-Lite | Highest free-tier quota; model override via `GEMINI_MODEL` |
| AI SDK | `@google/genai` (official) | Supports both `AIza` and `AQ.` key formats; enables `responseJsonSchema` |
| Schema validation | Zod | End-to-end type safety from API to UI |
| Performance data | Google PageSpeed Insights API | Free Lighthouse scores without running a browser |
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
| `GEMINI_API_KEY` | Yes | Google Gemini API key — get a free key at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) |
| `GEMINI_MODEL` | No | Override the default model (default: `gemini-2.5-flash-lite`) |
| `GOOGLE_PAGESPEED_API_KEY` | No | Google PageSpeed Insights API key — higher quota; without it the API works at ~2 req/100 s per IP |

**Gemini free-tier note:** Quota is per Google Cloud *project*, not per API key. Creating multiple keys in the same project does not increase limits. Use Flash-Lite (default), wait for the daily reset (midnight Pacific), or create a key in a *new* AI Studio project at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).

Copy `.env.example` to `.env.local` and fill in the values. Never commit `.env.local`.
