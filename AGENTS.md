# Website Audit Tool — Agent Context

> Read this file before making any changes to the codebase.
> It is the single source of truth for architecture decisions, constraints, and required outputs.

---

## Assignment Objective

Build a lightweight AI-powered Website Audit Tool for EIGHT25MEDIA — a web agency focused on SEO, conversion optimization, content clarity, and UX. The tool accepts a single URL, extracts factual page metrics, and uses OpenAI to generate structured insights and actionable recommendations. The goal is to demonstrate AI-native system design, clean separation of concerns, and prompt engineering quality.

---

## Evaluation Criteria

- AI-native thinking — not just API usage
- Ability to ground AI insights in structured, extracted data
- Code quality and organization
- Quality and usefulness of the generated insights
- Practical relevance to a web agency context

---

## Hard Constraints

- **Single page only** — NO multi-page crawling, NO sitemap traversal
- **Factual metrics MUST be separated from AI insights** — in UI, in code, and in prompts
- **Insights must cite extracted metrics** — no generic advice like "improve your SEO"
- **3–5 prioritized recommendations required** — each must reference specific metric values
- **Prompt logs are a required deliverable** — every OpenAI call must be logged

---

## Stack Decisions

| Concern | Choice | Reason |
|---------|--------|--------|
| Framework | Next.js 15 App Router + TypeScript | Full-stack, API routes, Vercel-ready |
| Styling | Tailwind CSS v4 | Rapid, consistent, agency-quality UI |
| HTML parsing | Cheerio | Lightweight, jQuery-like, server-side only |
| AI provider | OpenAI gpt-4o | Structured JSON output support, best quality |
| Schema validation | Zod | End-to-end type safety from API to UI |
| Deployment | Vercel | Native Next.js support |

---

## Architecture (Strict Boundaries)

```
HTTP Fetch → HTML Parse → Metric Extraction → AI Analysis → Response
  (scraper/)   (scraper/)    (metrics/)          (ai/)
```

### Layer rules

| Directory | Owns | Forbidden |
|-----------|------|-----------|
| `src/lib/scraper/` | HTTP fetch, Cheerio DOM loading | OpenAI imports, metric logic |
| `src/lib/metrics/` | Pure metric extractor functions | OpenAI imports, fetch logic |
| `src/lib/ai/` | Prompts, OpenAI call, Zod validation | Direct fetch or Cheerio |
| `src/lib/logging/` | Prompt log writer | Business logic |
| `src/types/` | Zod schemas + inferred types | Implementation logic |
| `src/app/api/audit/` | Route orchestration, error handling | Inline prompts, direct OpenAI |

---

## Required Factual Metrics (all 8 must be implemented)

1. `wordCount` — total word count from page body
2. `h1Count` — number of H1 elements
3. `h2Count` — number of H2 elements
4. `h3Count` — number of H3 elements
5. `ctaCount` — buttons + primary action links (see CTA heuristic)
6. `internalLinks` — links with same host as page URL
7. `externalLinks` — links with different host
8. `imageCount` — total `<img>` elements
9. `altTextPercent` — percentage of images WITH alt text (0–100)
10. `metaTitle` — `<title>` content (nullable)
11. `metaDescription` — `<meta name="description">` content (nullable)

---

## AI Output Schema

Every OpenAI response must conform to `AuditInsightsSchema` (Zod):

```
seo          → { summary, findings[] }
messaging    → { summary, findings[] }
cta          → { summary, findings[] }
contentDepth → { summary, findings[] }
ux           → { summary, findings[] }
recommendations[] → { priority (1–5), title, reasoning, metricRefs[] }
```

Each `finding` must reference a metric key (e.g. `"h1Count is 0"`).
`metricRefs` must list the metric keys cited in `reasoning`.

---

## Prompt Log Policy

Every call to OpenAI must produce a log entry containing:

1. System prompt (full text)
2. User prompt (rendered template with all values filled in)
3. Structured input sent to model (JSON: metrics + contentExcerpt)
4. Raw model output (before Zod parsing)
5. Model name + timestamp + URL

Logs written to `docs/prompt-logs/{YYYY-MM-DD}/{id}.md` in development.
Curated examples committed to `docs/prompt-logs/examples/` for submission.

---

## CTA Detection Heuristic

CTAs are counted by matching:
- All `<button>` elements
- Elements with `role="button"`
- `<a>` tags whose class contains: `btn`, `cta`, `button`, `action`
- `<a>` tags whose text matches: `get started`, `contact`, `sign up`, `learn more`, `request`, `book`, `download`, `try`, `start`

Document limitations: heuristic may miss CSS-only styled CTAs or JavaScript-rendered buttons.

---

## What NOT To Do

- No crawler / sitemap / multi-page fetching
- Never send raw HTML to OpenAI — use structured `PageMetrics` + truncated content excerpt
- Never write prompts inline in route handlers — prompts live in `src/lib/ai/prompts/`
- Never use `any` type in `scraper/`, `metrics/`, or `ai/` directories
- Never mix metric extraction with AI calls in the same function
