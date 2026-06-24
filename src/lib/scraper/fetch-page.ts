import { FetchError } from './errors';

const TIMEOUT_MS = 10_000;
const USER_AGENT = 'Mozilla/5.0 (compatible; WebAuditBot/1.0)';

/**
 * Fetches a single page and returns its raw HTML string.
 *
 * - 10-second timeout via AbortController
 * - Sends a realistic User-Agent to reduce bot-blocking
 * - Throws FetchError on network failure, timeout, or non-2xx status
 */
export async function fetchPage(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new FetchError(url, null, response.status);
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('html') && !contentType.includes('text')) {
      throw new FetchError(
        url,
        new Error(`Unexpected content-type: ${contentType}`),
      );
    }

    return await response.text();
  } catch (err) {
    if (err instanceof FetchError) throw err;

    if (err instanceof Error && err.name === 'AbortError') {
      throw new FetchError(url, new Error(`Request timed out after ${TIMEOUT_MS}ms`));
    }

    throw new FetchError(url, err);
  } finally {
    clearTimeout(timeoutId);
  }
}
