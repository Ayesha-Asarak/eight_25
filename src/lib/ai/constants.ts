/**
 * AI layer constants — change model or limits in one place.
 *
 * Trade-off documented in README:
 * - gemini-2.5-flash-lite has the highest free-tier quota (~1,000 req/day vs ~250)
 * - Uses the native Gemini generateContent API (supports both AIza and AQ. keys)
 *
 * Quota is per Google Cloud *project*, not per API key — creating more keys in the
 * same project does not increase limits. Override via GEMINI_MODEL in .env.local.
 */

/** Default model — Flash-Lite for best free-tier throughput during development */
export const DEFAULT_AUDIT_MODEL = 'gemini-2.5-flash-lite';

/**
 * Models tried in order on 429 (quota) or 503 (overloaded).
 * Each model has its own separate free-tier quota bucket.
 * Order: highest free quota first.
 * Note: gemini-1.5-x removed — not available on v1beta generateContent.
 */
export const MODEL_FALLBACK_CHAIN = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
] as const;

/** Resolved at call time so GEMINI_MODEL in .env.local can override without rebuild */
export function getAuditModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_AUDIT_MODEL;
}

/** Primary model first, then fallbacks — deduped, respects GEMINI_MODEL override */
export function getModelFallbackChain(): string[] {
  const primary = getAuditModel();
  return [...new Set([primary, ...MODEL_FALLBACK_CHAIN])];
}

/** @deprecated Use getAuditModel() — kept for tests that import the constant name */
export const AUDIT_MODEL = DEFAULT_AUDIT_MODEL;

/** Max characters of page body text sent to the model */
export const CONTENT_EXCERPT_MAX_LENGTH = 5000;

/** Cap completion size — audit JSON rarely exceeds ~3k tokens */
export const MAX_OUTPUT_TOKENS = 4096;

/** Number of times to retry after a Zod validation failure */
export const MAX_VALIDATION_RETRIES = 1;
