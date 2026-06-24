/**
 * JSON Schema reference for Gemini structured output.
 *
 * This is the hand-written JSON schema that mirrors AuditInsightsSchema (Zod).
 * Passed to Gemini responseJsonSchema for reliable structured output on the native API.
 *
 * Design decision: hand-written instead of zod-to-json-schema because:
 * - Avoids an extra dependency
 * - Easier to audit for correctness
 *
 * If AuditInsightsSchema changes in src/types/audit.ts, update this file too.
 */

const insightCategorySchema = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    findings: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['summary', 'findings'],
  additionalProperties: false,
} as const;

const recommendationSchema = {
  type: 'object',
  properties: {
    priority: {
      type: 'integer',
      minimum: 1,
      maximum: 5,
      description: '1 = highest impact, 5 = lowest',
    },
    title: { type: 'string' },
    reasoning: {
      type: 'string',
      description: 'Must reference specific metric values from the input',
    },
    metricRefs: {
      type: 'array',
      items: { type: 'string' },
      description: 'Metric field names cited in reasoning',
    },
  },
  required: ['priority', 'title', 'reasoning', 'metricRefs'],
  additionalProperties: false,
} as const;

export const AUDIT_INSIGHTS_JSON_SCHEMA = {
  name: 'audit_insights',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      seo: insightCategorySchema,
      messaging: insightCategorySchema,
      cta: insightCategorySchema,
      contentDepth: insightCategorySchema,
      ux: insightCategorySchema,
      recommendations: {
        type: 'array',
        items: recommendationSchema,
        minItems: 3,
        maxItems: 5,
        description: 'Ranked 1–5 by business impact',
      },
    },
    required: ['seo', 'messaging', 'cta', 'contentDepth', 'ux', 'recommendations'],
    additionalProperties: false,
  },
} as const;

/** Inner schema object for Gemini native API responseJsonSchema */
export const GEMINI_AUDIT_INSIGHTS_SCHEMA = AUDIT_INSIGHTS_JSON_SCHEMA.schema;
