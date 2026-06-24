# Architecture

> This document will be completed in Phase 4 after the full implementation is working.
> Skeleton headings are here so the structure is committed from day one.

---

## Overview

(TBD — Phase 4: 1-paragraph description of the audit pipeline)

---

## Data Flow

```
(TBD — Phase 4: mermaid sequence diagram)
```

The high-level flow:
1. User submits URL via the web interface
2. `POST /api/audit` receives the request
3. Scraper fetches and parses the HTML
4. Metrics layer extracts all 8 factual metrics deterministically
5. AI layer builds a structured input payload (metrics + content excerpt)
6. OpenAI returns a validated `AuditInsights` JSON object
7. Prompt logger writes the full trace to `docs/prompt-logs/`
8. API returns combined `AuditResult` to the frontend
9. UI renders metrics and AI insights in clearly separated sections

---

## Layer Responsibilities

| Layer | Directory | Responsibility |
|-------|-----------|----------------|
| Scraper | `src/lib/scraper/` | (TBD — Phase 4) |
| Metrics | `src/lib/metrics/` | (TBD — Phase 4) |
| AI | `src/lib/ai/` | (TBD — Phase 4) |
| Logging | `src/lib/logging/` | (TBD — Phase 4) |
| API | `src/app/api/audit/` | (TBD — Phase 4) |
| UI | `src/app/`, `src/components/` | (TBD — Phase 4) |

---

## Error Handling Strategy

(TBD — Phase 4)

---

## Trade-offs

(TBD — Phase 4: CTA heuristics, content truncation, bot blocking, Vercel timeout)
