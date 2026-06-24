import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';
import { readFileSync } from 'fs';
import { join } from 'path';
import { extractHeadings } from './extract-headings';

const sample = cheerio.load(
  readFileSync(join(__dirname, '__fixtures__/sample-page.html'), 'utf-8'),
);
const edge = cheerio.load(
  readFileSync(join(__dirname, '__fixtures__/edge-case.html'), 'utf-8'),
);

describe('extractHeadings', () => {
  it('counts H1, H2, H3 correctly on the sample page', () => {
    const result = extractHeadings(sample);
    expect(result.h1Count).toBe(1);
    expect(result.h2Count).toBe(2);
    expect(result.h3Count).toBe(2);
  });

  it('returns 0 for all levels when no headings are present', () => {
    const result = extractHeadings(edge);
    expect(result.h1Count).toBe(0);
    expect(result.h2Count).toBe(0);
    expect(result.h3Count).toBe(0);
  });

  it('counts multiple H1s when present', () => {
    const $ = cheerio.load('<h1>A</h1><h1>B</h1><h1>C</h1>');
    expect(extractHeadings($).h1Count).toBe(3);
  });
});
