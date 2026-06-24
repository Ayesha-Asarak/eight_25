import type { CheerioAPI } from 'cheerio';

export interface HeadingCounts {
  h1Count: number;
  h2Count: number;
  h3Count: number;
}

/**
 * Counts H1, H2, and H3 heading elements on the page.
 * Returns 0 for each level when none are found.
 */
export function extractHeadings($: CheerioAPI): HeadingCounts {
  return {
    h1Count: $('h1').length,
    h2Count: $('h2').length,
    h3Count: $('h3').length,
  };
}
