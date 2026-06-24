import { z } from 'zod';

const AuditRequestSchema = z.object({
  url: z
    .string({ required_error: 'URL is required.' })
    .min(1, 'URL is required.')
    .transform((val) => {
      // Prepend https:// if user omits protocol (e.g. "example.com")
      if (!/^https?:\/\//i.test(val)) return `https://${val}`;
      return val;
    })
    .pipe(z.string().url('Please enter a valid URL (e.g. https://example.com).')),
});

export interface ValidatedAuditRequest {
  url: string;
}

/**
 * Validates and normalises the POST /api/audit request body.
 * Prepends https:// when the user omits the protocol.
 * Throws a ZodError (caught by mapToAuditError) on invalid input.
 */
export function validateAuditRequest(body: unknown): ValidatedAuditRequest {
  const { url } = AuditRequestSchema.parse(body);
  return { url };
}
