import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';
import { readFileSync } from 'fs';
import { join } from 'path';
import { extractImages } from './extract-images';

const sample = cheerio.load(
  readFileSync(join(__dirname, '__fixtures__/sample-page.html'), 'utf-8'),
);
const edge = cheerio.load(
  readFileSync(join(__dirname, '__fixtures__/edge-case.html'), 'utf-8'),
);

describe('extractImages', () => {
  it('counts 4 images on the sample page', () => {
    const result = extractImages(sample);
    expect(result.imageCount).toBe(4);
  });

  it('calculates altTextPercent correctly (2 out of 4 have good alt)', () => {
    // sample-page: 4 images — 2 with real alt, 1 with empty alt="", 1 with no alt attr
    // Expected: 2/4 = 50%
    const result = extractImages(sample);
    expect(result.altTextPercent).toBe(50);
  });

  it('returns 0 for both fields when page has no images', () => {
    const result = extractImages(edge);
    expect(result.imageCount).toBe(0);
    expect(result.altTextPercent).toBe(0);
  });

  it('returns 100% when all images have alt text', () => {
    const $ = cheerio.load(
      '<img src="a.jpg" alt="Image A" /><img src="b.jpg" alt="Image B" />',
    );
    expect(extractImages($).altTextPercent).toBe(100);
  });

  it('treats empty alt="" as missing alt', () => {
    const $ = cheerio.load(
      '<img src="a.jpg" alt="" /><img src="b.jpg" alt="Good" />',
    );
    const result = extractImages($);
    expect(result.imageCount).toBe(2);
    expect(result.altTextPercent).toBe(50);
  });
});
