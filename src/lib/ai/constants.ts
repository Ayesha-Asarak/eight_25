/**
 * AI layer constants — change model or limits in one place.
 *
 * Trade-off documented in README:
 * - gpt-4o gives best structured output quality for the assignment
 * - gpt-4o-mini is faster/cheaper but less reliable at complex JSON schemas
 */

export const AUDIT_MODEL = 'gpt-4o' as const;

/** Max characters of page body text sent to the model */
export const CONTENT_EXCERPT_MAX_LENGTH = 5000;

/** Number of times to retry after a Zod validation failure */
export const MAX_VALIDATION_RETRIES = 1;
