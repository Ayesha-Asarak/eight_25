# Website Audit Tool — EIGHT25MEDIA

> AI-powered single-page website auditor. Extracts factual metrics and generates structured insights using OpenAI.

**Live Demo:** _Deployed link will be added in Phase 4_

---

## Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/eight25-website-audit
cd eight25-website-audit
npm install
cp .env.example .env.local
# Edit .env.local and add your OPENAI_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), enter any public URL, and run an audit.

---

## Architecture Overview

_Full diagram and detail in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — completed in Phase 4._

**High-level pipeline:**

```
URL input → fetch HTML → extract metrics → build AI payload → OpenAI → display results
           (scraper/)    (metrics/)        (ai/)              (gpt-4o)  (Next.js UI)
```

**Key design principle:** factual metrics are extracted before and separately from AI analysis. The AI layer receives structured JSON — never raw HTML.

---

## AI Design Decisions

_Detailed in Phase 4 — summary:_
- Uses OpenAI structured outputs (`response_format: json_schema`) for reliable parsing
- Metrics are passed as structured JSON to ground every AI finding in real data
- Prompts live in dedicated files (`src/lib/ai/prompts/`), not inline in route handlers
- Every AI call is logged to `docs/prompt-logs/` for full auditability

---

## Trade-offs

_Completed in Phase 4._

---

## Future Improvements

_Completed in Phase 4._

---

## Prompt Logs

Prompt logs are in [`docs/prompt-logs/examples/`](docs/prompt-logs/examples/).

Each log shows the system prompt, constructed user prompt, structured input sent to the model, and raw model output.

---

## Project Structure

```
src/
├── app/
│   ├── api/audit/        # POST endpoint — audit orchestration
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── scraper/          # HTTP fetch + Cheerio parsing (NO AI)
│   ├── metrics/          # Pure metric extractors (NO AI)
│   ├── ai/               # Prompts, OpenAI, Zod validation
│   │   └── prompts/      # System + user prompt files
│   └── logging/          # Prompt log writer
├── components/           # React UI components
└── types/                # Shared Zod schemas and TypeScript types
docs/
├── ARCHITECTURE.md
└── prompt-logs/
    └── examples/         # Curated submission logs
.cursor/
├── rules/                # Cursor agent rules
└── skills/               # Project workflow skills
```
