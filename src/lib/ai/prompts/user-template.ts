import type { AIStructuredInput } from '@/types/prompt-log';
import { CONTENT_EXCERPT_MAX_LENGTH } from '@/lib/ai/constants';

/**
 * Builds the user message sent to Gemini for each audit.
 *
 * Design decisions:
 * - Metrics are pretty-printed JSON so they are readable in prompt logs
 * - Content excerpt is clearly separated and labelled as truncated
 * - Explicit instruction to reference metric keys prevents generic responses
 * - Pure function — no side effects, easy to test and log
 */
export function buildUserPrompt(input: AIStructuredInput): string {
  const metricsJson = JSON.stringify(input.metrics, null, 2);
  const excerptNote =
    input.contentExcerpt.endsWith('…')
      ? `(truncated to ${CONTENT_EXCERPT_MAX_LENGTH} characters)`
      : `(${input.contentExcerpt.length} characters)`;

  return `Audit the following webpage and return a structured JSON analysis.

## Page URL
${input.url}

## Factual Metrics
These values were extracted deterministically. Do not modify or contradict them.

\`\`\`json
${metricsJson}
\`\`\`

## Content Excerpt ${excerptNote}
The following is the plain-text body content of the page. Use it to assess messaging clarity, content depth, and CTA language.

---
${input.contentExcerpt}
---

## Instructions
- Reference metric field names (e.g. h1Count, ctaCount) explicitly in your findings and reasoning.
- Populate metricRefs with every metric key you cite.
- Return only the JSON object — no markdown, no extra text.`;
}
