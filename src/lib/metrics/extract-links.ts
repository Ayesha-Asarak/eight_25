import type { CheerioAPI } from 'cheerio';

export interface LinkCounts {
  internalLinks: number;
  externalLinks: number;
}

// Protocols that are not navigational links and should be skipped
const SKIP_PROTOCOLS = new Set(['mailto:', 'tel:', 'javascript:', 'data:', 'sms:']);

/**
 * Counts internal vs external links on the page.
 *
 * - Internal: same host as the page URL (including www-normalised comparisons)
 * - External: different host
 * - Skips: mailto, tel, javascript, data URIs, pure hash anchors (#section)
 * - Handles relative URLs by resolving them against the page URL
 */
export function extractLinks($: CheerioAPI, pageUrl: string): LinkCounts {
  let pageHost: string;

  try {
    pageHost = new URL(pageUrl).hostname.replace(/^www\./, '');
  } catch {
    // If the page URL is unparseable, count all links as external
    pageHost = '';
  }

  let internalLinks = 0;
  let externalLinks = 0;

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')?.trim();
    if (!href) return;

    // Skip pure fragment anchors
    if (href.startsWith('#')) return;

    // Skip non-navigational protocols
    const colonIdx = href.indexOf(':');
    if (colonIdx !== -1) {
      const protocol = href.slice(0, colonIdx + 1).toLowerCase();
      if (SKIP_PROTOCOLS.has(protocol)) return;
    }

    try {
      // Resolve relative URLs against the page origin
      const resolved = new URL(href, pageUrl);
      const linkHost = resolved.hostname.replace(/^www\./, '');

      if (pageHost && linkHost === pageHost) {
        internalLinks++;
      } else {
        externalLinks++;
      }
    } catch {
      // Malformed href — skip
    }
  });

  return { internalLinks, externalLinks };
}
