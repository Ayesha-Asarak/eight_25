import type { AuditResult } from './audit';

/** Successful response from POST /api/audit */
export interface AuditResponse {
  data: AuditResult;
}

/** Error response from POST /api/audit */
export interface AuditErrorResponse {
  error: string;
  /** Machine-readable error code for client error handling */
  code: 'INVALID_URL' | 'FETCH_FAILED' | 'PARSE_FAILED' | 'AI_FAILED' | 'RATE_LIMITED' | 'UNKNOWN';
}
