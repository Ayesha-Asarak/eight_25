import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';
import { readFileSync } from 'fs';
import { join } from 'path';
import { extractLinks } from './extract-links';

const PAGE_URL = 'https://www.eight25media.com/';

const sample = cheerio.load(
  readFileSync(join(__dirname, '__fixtures__/sample-page.html'), 'utf-8'),
);
const edge = cheerio.load(
  readFileSync(join(__dirname, '__fixtures__/edge-case.html'), 'utf-8'),
);

describe('extractLinks', () => {
  it('classifies internal and external links correctly on the sample page', () => {
    const result = extractLinks(sample, PAGE_URL);
    // Internal: /, /about, /services, #contact(skipped), /blog, /services/seo, /contact, /case-studies, /blog, /privacy
    // External: twitter.com, linkedin.com, example.com/partner
    expect(result.internalLinks).toBeGreaterThan(0);
    expect(result.externalLinks).toBeGreaterThan(0);
  });

  it('skips mailto, tel, and hash-only hrefs', () => {
    const result = extractLinks(edge, 'https://example.com/');
    // edge-case.html has: 1 external, 1 mailto (skip), 1 hash (skip), 1 tel (skip)
    expect(result.externalLinks).toBe(1);
    expect(result.internalLinks).toBe(0);
  });

  it('treats same-host relative URLs as internal', () => {
    const $ = cheerio.load(
      '<a href="/about">About</a><a href="https://mysite.com/contact">Contact</a>',
    );
    const result = extractLinks($, 'https://mysite.com/');
    expect(result.internalLinks).toBe(2);
    expect(result.externalLinks).toBe(0);
  });

  it('treats different-host URLs as external', () => {
    const $ = cheerio.load('<a href="https://otherdomain.com/page">Other</a>');
    const result = extractLinks($, 'https://mysite.com/');
    expect(result.externalLinks).toBe(1);
    expect(result.internalLinks).toBe(0);
  });

  it('normalises www prefix when comparing hosts', () => {
    const $ = cheerio.load('<a href="https://www.mysite.com/page">Page</a>');
    const result = extractLinks($, 'https://mysite.com/');
    expect(result.internalLinks).toBe(1);
  });
});
