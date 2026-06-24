import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';
import { readFileSync } from 'fs';
import { join } from 'path';
import { extractWordCount } from './extract-word-count';

const sample = cheerio.load(
  readFileSync(join(__dirname, '__fixtures__/sample-page.html'), 'utf-8'),
);
const edge = cheerio.load(
  readFileSync(join(__dirname, '__fixtures__/edge-case.html'), 'utf-8'),
);

describe('extractWordCount', () => {
  it('returns a positive word count for the sample page', () => {
    const count = extractWordCount(sample);
    expect(count).toBeGreaterThan(30);
  });

  it('prefers <main> content over entire body', () => {
    const withMain = cheerio.load(
      '<body><nav>nav words</nav><main>main content words here</main><footer>footer words</footer></body>',
    );
    const withoutMain = cheerio.load(
      '<body><nav>nav words</nav><p>main content words here</p><footer>footer words</footer></body>',
    );
    // With <main>, should only count words inside main (4 words)
    expect(extractWordCount(withMain)).toBe(4);
    // Without <main>, counts everything in body
    expect(extractWordCount(withoutMain)).toBeGreaterThan(4);
  });

  it('returns 0 for empty body', () => {
    const $ = cheerio.load('<html><body></body></html>');
    expect(extractWordCount($)).toBe(0);
  });

  it('handles whitespace-only body gracefully', () => {
    const $ = cheerio.load('<html><body>   \n\t  </body></html>');
    expect(extractWordCount($)).toBe(0);
  });

  it('edge case page has words despite no main tag', () => {
    const count = extractWordCount(edge);
    expect(count).toBeGreaterThan(0);
  });
});
