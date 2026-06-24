---
name: website-audit-workflow
description: Guides implementation of the website audit pipeline from scraping through AI analysis. Use when building or modifying scraper, metrics extractors, API route, or audit pipeline features.
disable-model-invocation: true
---

# Website Audit Workflow

Use this checklist when adding or modifying any part of the audit pipeline.

## Step-by-Step Checklist

```
Task Progress:
- [ ] 1. Update Zod schema in src/types/audit.ts if the data shape changes
- [ ] 2. Implement/update extractor in src/lib/metrics/ (no AI imports)
- [ ] 3. Export from src/lib/metrics/index.ts
- [ ] 4. Wire into API route: scraper runs before AI
- [ ] 5. Build/update structured AI input payload in src/lib/ai/build-input.ts
- [ ] 6. Test on 2–3 real URLs — verify AI insights cite specific metric values
- [ ] 7. Confirm a prompt log was written to docs/prompt-logs/
```

## Layer Order (Never Skip)

```
fetch-page.ts → parse-html.ts → metrics/index.ts → build-input.ts → analyze-page.ts → writePromptLog()
```

## Key Files

| File | Role |
|------|------|
| `src/lib/scraper/fetch-page.ts` | HTTP fetch with timeout |
| `src/lib/scraper/parse-html.ts` | Cheerio DOM loader |
| `src/lib/metrics/index.ts` | Orchestrates all extractors |
| `src/lib/ai/build-input.ts` | Builds structured payload for OpenAI |
| `src/lib/ai/analyze-page.ts` | Calls OpenAI + validates + logs |
| `src/app/api/audit/route.ts` | Next.js route — orchestration only |

## Adding a New Metric

1. Add field to `PageMetricsSchema` in `src/types/audit.ts`
2. Create `src/lib/metrics/extract-{name}.ts`
3. Import and call in `src/lib/metrics/index.ts`
4. Add to AI input payload in `src/lib/ai/build-input.ts`
5. Update system prompt if the metric should inform AI analysis
